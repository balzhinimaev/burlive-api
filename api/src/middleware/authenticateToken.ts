// src/middleware/authenticateToken.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import JwtTokenModel from '../models/Token'; // Adjust path as needed
import UserModel, { IUser } from '../models/User'; // Adjust path as needed
import logger from '../utils/logger'; // Adjust path as needed
import { DecodedToken } from '../../types/express';
import { ObjectId } from 'mongodb';

/**
 * Middleware for verifying JWT Bearer tokens from the Authorization header.
 * Checks token validity, expiration, signature, and existence in the active token store.
 * Attaches the authenticated user entity (IUser) to `req.user`.
 */
const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeader = req.headers['authorization'];

    // Enforce Bearer scheme
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            message: 'Authorization token (Bearer) required',
        });
        return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    // Configuration check
    if (!jwtSecret) {
        logger.error('Server configuration error: JWT_SECRET is not set.');
        res.status(500).json({
            message: 'Internal server configuration error',
        });
        return;
    }

    try {
        // Verify JWT signature and expiration
        const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

        // Verify token against the active token store (prevents replay after logout/revocation)
        const existingToken = await JwtTokenModel.findOne({
            userId: new ObjectId(decoded._id),
            token,
            // sessionId: decoded.sessionId // Include if session binding is used
        });

        if (!existingToken) {
            logger.warn(
                `Attempted use of revoked or invalid token for user ${decoded._id}`,
            );
            res.status(401).json({
                message: 'Invalid or revoked authentication token',
            });
            return;
        }

        // Fetch current user state from primary data store
        const user: IUser | null = await UserModel.findById(decoded._id);

        if (!user) {
            // Valid token for a non-existent user (edge case, e.g., deleted user)
            logger.warn(
                `User ${decoded._id} from valid token not found in primary store.`,
            );
            res.status(401).json({ message: 'Authenticated entity not found' });
            return;
        }

        // Attach user context to the request object for downstream handlers
        req.user = user;

        next();
    } catch (error: any) {
        // Log detailed verification error
        logger.error(`Token verification failed: ${error.message}`, {
            tokenSnippet: token.substring(0, 10) + '...', // Avoid logging full token
            errorName: error.name,
            // errorStack: error.stack // Optional: include stack for detailed debugging
        });

        // Provide specific error responses based on JWT error types
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                message: `Invalid token: ${error.message}`,
            });
        } else if (error instanceof jwt.NotBeforeError) {
            res.status(401).json({
                message: `Token not yet active: ${error.message}`,
            });
        } else {
            // Fallback for unexpected errors (e.g., DB issues during token lookup)
            res.status(500).json({
                message: 'Internal server error during authentication',
            });
        }
    }
};

export default authenticateToken;
