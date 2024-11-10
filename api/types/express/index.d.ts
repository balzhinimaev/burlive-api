// @types/express/index.d.ts

import { IUser } from '../../src/models/User'; // Adjust the path as necessary
import { ISuggestedWordModel } from "../../src/models/Vocabulary/SuggestedWordModel";


declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            suggestedWord?: ISuggestedWordModel; // If you have other custom properties
            telegram_user_id?: number;
        }
    }
}

export { }; // Ensures this file is treated as a module
