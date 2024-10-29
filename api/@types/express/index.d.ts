// @types/express/index.d.ts

import { ISuggestedWordModel } from '../../src/models/Vocabulary/SuggestedWordModel';

declare global {
    namespace Express {
        interface Request {
            suggestedWord?: ISuggestedWordModel;
            telegram_user_id?: number;
        }
    }
}

export { };
