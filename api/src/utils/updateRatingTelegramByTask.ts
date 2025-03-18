import logger from "./logger";
import TelegramUserModel from "../models/TelegramUsers";

// В том же файле или в файле, где вы храните свои функции утилит
const updateRatingByTask = async (userId: any, _taskId: string, rating?: number) => {
    try {
        const result = await TelegramUserModel.findByIdAndUpdate(userId, {
            $inc: {
                rating: rating ? rating : 10
            }
        }, { new: true });

        if (!result) {
            return null
        } else {
            
            logger.info(`Рейтинг пользователя ${userId} обновлён!, ${result.rating}`)
            return result.rating
        
        }
    } catch (error) {
        logger.error(`Ошибка при обновлении рейтинга пользователя, ${error}`)
        return false
    }
};

export default updateRatingByTask;