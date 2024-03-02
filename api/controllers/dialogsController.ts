// dialogsController.ts 
import { Request, Response } from 'express';
import logger from "../utils/logger";
import { DialogModel } from '../models/Dialog';

const dialogsController = {
    create: async (req: Request, res: Response) => {
        try {
            
            const { messages } = req.body

            console.log(messages)
            
            await new DialogModel(messages).save().then(result => console.log(result))

            return res.status(200).json({ messages })

        } catch {
            logger.error('error')
        }
    },
    save: async (req: Request, res: Response) => {

        try {
            console.log(123)
            const dialogs = await DialogModel.find()
            console.log(dialogs)

            return res.status(200)

        } catch (error) {
            logger.error('error')
        }

    }
};

export default dialogsController;
