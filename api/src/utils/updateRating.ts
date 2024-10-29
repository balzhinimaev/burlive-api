import User from "../models/User";
import logger from "./logger";

// В том же файле или в файле, где вы храните свои функции утилит
const updateRating = async (userId: any) => {
    try {
        const result = await User.findByIdAndUpdate(userId, {
            $inc: {
                rating: 100
            }
        }, { new: true });

        if (!result) {
            return null
        } else {
            
            logger.info(`Рейтинг пользователя обновлён!, ${result.rating}`)
            return result.rating
        
        }
    } catch (error) {
        logger.error(`Ошибка при обновлении рейтинга пользователя, ${error}`)
        return false
    }
};

export default updateRating