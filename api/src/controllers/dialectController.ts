import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import Dialect from '../models/Dialect';

interface DialectRequestBody {
    name: string;
    description: string;
    region: string
}

interface DialectRequest extends Request {
    body: DialectRequestBody;
}

const dialectController = {
    create: async (req: DialectRequest, res: Response, next: NextFunction): Promise<void> => {
        
        try {

            const { name, description } = req.body

            await new Dialect({ name, description }).save()
                .then(async (document) => {
                    
                    logger.info(`Новый диалект сохранён ${ document._id }`)
                    res.status(201).json({ message: 'Новый диалект сохранён', dialectId: document._id })

                })

            return

        } catch (error) {
            
            console.log(error)
            logger.error(`Ошибка при создании диалекта, ${error}`)
            res.status(500).json({ message: 'Ошибка при создании диалекта' })

            next(error)

        }
    
    },
};

export default dialectController;
