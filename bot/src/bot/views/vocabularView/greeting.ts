import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import { saveSceneMiddleware } from "../../utlis/saveSceneMiddleware"

export default async function greeting(ctx: rlhubContext) {

    try {

        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Русский',
                            callback_data: 'selectlanguage russian'
                        },
                        {
                            text: 'Бурятский',
                            callback_data: 'selectlanguage buryat'
                        }
                    ],
                    [
                        {
                            text: 'Дополнить словарь',
                            callback_data: 'update-vocabulary'
                        }
                    ],
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back'
                        }
                    ],
                ]
            }
        }

        let message = `<b>Словарь</b> \n\nВыберите язык с которого нужно перевести`

        ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : false

        ctx.wizard.selectStep(0)
        await saveSceneMiddleware(ctx)
        // next()
    } catch (err) {

        console.log(err)

    }
}