import dotenv from 'dotenv';
import rlhubContext from './bot/models/rlhubContext';
import { Scenes, Telegraf, session } from 'telegraf';
dotenv.config()

export const bot = new Telegraf<rlhubContext>(process.env.BOT_TOKEN!);

import './app'
import './webhook'
import './database'

import home from './bot/views/home.scene';
import sentences from './bot/views/sentences.scene';
import settings from './bot/views/settings.scene';
import dashboard from './bot/views/dashboard.scene';
import vocabular from './bot/views/vocabular.scene';
import moderation from './bot/views/moderation.scene';
import chat from './bot/views/chat.scene';
import { Translation, voteModel } from './models/ISentence';
import { IUser, User } from './models/IUser';
import { ExtraEditMessageText } from 'telegraf/typings/telegram-types';
import { InlineQueryResult } from 'telegraf/typings/core/types/typegram';
import { greeting } from './bot/views/home.scene';
const stage: any = new Scenes.Stage<rlhubContext>([home, chat, vocabular, sentences, dashboard, moderation, settings], { default: 'home' });

console.log('hi')

async function ps_greeting(ctx: rlhubContext) {

    let users: IUser[] | null = await User.find()

    if (users) {

        users.forEach(async (user: IUser) => {

            if (user.interface_language) {

                ctx.scene.session.interface_ln = user.interface_language

            } else {

                ctx.scene.session.interface_ln = 'russian'

            }

            let keyboard_translates: any = {
                learns: {
                    russian: 'Самоучитель',
                    english: 'Learns',
                    buryat: 'Заабари'
                },
                dictionary: {
                    russian: 'Словарь',
                    english: 'Dictionary',
                    buryat: 'Толи'
                },
                sentences: {
                    russian: 'Предложения',
                    english: 'Sentences',
                    buryat: 'Мэдуулэлнуд'
                },
                translator: {
                    russian: 'Переводчик',
                    english: 'Translator',
                    buryat: 'Оршуулгари'
                },
                moderation: {
                    russian: 'Модерация',
                    english: 'Moderation',
                    buryat: 'Зохисуулал'
                },
                dashboard: {
                    russian: 'Личный кабинет',
                    english: 'Dashboard',
                    buryat: 'Оорын таhaг'
                }
            }

            const extra: ExtraEditMessageText = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: keyboard_translates.learns[ctx.scene.session.interface_ln], callback_data: "study" },
                            { text: keyboard_translates.dictionary[ctx.scene.session.interface_ln], callback_data: "vocabular" }
                        ],
                        [{ text: keyboard_translates.sentences[ctx.scene.session.interface_ln], callback_data: 'sentences' }],
                        [{ text: keyboard_translates.translator[ctx.scene.session.interface_ln], callback_data: 'translater' }],
                        [{ text: keyboard_translates.moderation[ctx.scene.session.interface_ln], callback_data: 'moderation' }],
                        [{ text: "🔓 Chat GPT", callback_data: "chatgpt" }],
                        [{ text: keyboard_translates.dashboard[ctx.scene.session.interface_ln], callback_data: "dashboard" }],
                    ]
                }
            }

            let message: any = {
                russian: `Самоучитель бурятского языка \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nВыберите раздел, чтобы приступить`,
                buryat: `Буряд хэлэнэ заабари \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nЭхилхиин, нэгэ юумэ дарагты`,
                english: `Buryat Language Tutorial \n\nEvery interaction with the bot affects the preservation and further development of the Buryat language \n\nChoose a section to start`,
            }

            try {

                // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
                ctx.updateType === 'callback_query' ? await ctx.editMessageText(message[ctx.scene.session.interface_ln], extra) : ctx.reply(message[ctx.scene.session.interface_ln], extra)

            } catch (err) {

                console.log(err)

            }

        });

    }

}



// (async () => {
//     const extra: ExtraEditMessageText = {
//         parse_mode: 'HTML',
//         reply_markup: {
//             inline_keyboard: [
//                 [
//                     { text: "Самоучитель", callback_data: "study" },
//                     { text: "Словарь", callback_data: "vocabular" }
//                 ],
//                 [{ text: 'Предложения', callback_data: 'sentences' }],
//                 [{ text: 'Переводчик', callback_data: 'translater' }],
//                 [{ text: 'Модерация', callback_data: 'moderation' }],
//                 [{ text: "🔐 Chat GPT", callback_data: "chatgpt" }],
//                 [{ text: "Личный кабинет", callback_data: "dashboard" }]
//             ]
//         }
//     }

//     let message = `Самоучитель бурятского языка \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b>`
//     message += '\n\nВыберите раздел, чтобы приступить'

//     try {

//         let users = await User.find()
//         users.forEach(async (element) => {
//             if (element.id) {
//                 try {
//                     await bot.telegram.sendMessage(`${element.id}`, message, extra)
//                 } catch (err) {
//                     console.log(err)
//                 }
//             }
//         });

//         // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
//         // ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : ctx.reply(message, extra)
//         // bot.telegram.sendMessage(1272270574, message, extra)

//     } catch (err) {

//         console.log(err)

//     }
// })();


// (async () => {
//     try {

//         bot.telegram.sendMessage(1272270574, 'бот запущен!! \n/start')

//         const users: IUser[] | null = await User.find()

//         if (users === null) { return false }

//         for (let i = 0; i < users.length; i++) {

//             await User.findByIdAndUpdate(users[i]._id, {
//                 $set: {
//                     temperature: 45,
//                     max_tokens: 4000
//                 }
//             }).then(() => {

//                 // console.log(`Для ${users[i].id} max_tokens и temperature установлены`)

//             })

//         }

//     } catch (err) {
//         console.error(err)
//     }
// })();

home.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
chat.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
vocabular.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
sentences.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
dashboard.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
moderation.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })
settings.command('chat', async (ctx: rlhubContext) => { await ctx.scene.enter('chatgpt') })

home.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
chat.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
vocabular.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
sentences.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
dashboard.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
moderation.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })
settings.command('home', async (ctx: rlhubContext) => { await ctx.scene.enter('home') })

home.command(`hi`, async (ctx: rlhubContext) => { await ctx.reply('hi') })

home.command('get_users', async (ctx: rlhubContext) => {

    let user = await User.findOne({
        id: ctx.from?.id
    })

    if (user?.permissions?.admin) {

        let users = await User.find()
        let stats: {
            count: number
        } = {
            count: users.length
        }

        let message: string = ``

        message += `Количество пользователей: ${stats.count}\n`
        message += `/list\n`
        message += `/sendemail\n`

        return ctx.reply(message)

    } else {
        return ctx.reply('Прав нет!')
    }

});

home.command('list', async (ctx: rlhubContext) => {

    const users = await User.find()
    let message: string = ``

    users.forEach(async (element, index) => {
        message += `${index}) `

        if (element.username) {
            message += `@${element.username} `
        }

        if (element.first_name) {
            message += `<i>${element.first_name}</i>`
        }

        message += `\n`
    })

    await ctx.reply(message, { parse_mode: 'HTML' })

})

// права админа
home.command('add_permissions', async(ctx: rlhubContext) => {

    return await User.findOneAndUpdate({
        id: ctx.from?.id
    }, {
        $set: {
            permissions: {
                admin: true
            }
        }
    }).then(async () => {
        await ctx.reply('права переданы')
    }).catch(async (error) => {
        await ctx.reply('возникла ошибка')
        console.error(error)
    })

})

bot.use(session())
bot.use(stage.middleware())
bot.start(async (ctx) => {
    await ctx.scene.enter('home')
    // ctx.deleteMessage(874)
})
bot.action(/./, async function (ctx: rlhubContext) {
    // await ctx.scene.enter('home')
    ctx.answerCbQuery()
    await greeting(ctx, true)
})
bot.command('update_translates_collection', async (ctx) => {

    let translates = await Translation.find()
    translates.forEach(async (element: any) => {

        let votes = element.votes
        let rating = 0

        if (votes) {

            let pluses = 0
            let minuses = 0

            for (let i = 0; i < votes.length; i++) {

                let voteDocument = await voteModel.findById(votes[i])

                if (voteDocument) {

                    if (voteDocument.vote === true) {
                        pluses++
                    } else {
                        minuses++
                    }

                }

            }

            rating = pluses - minuses
        }

        await Translation.findByIdAndUpdate(element._id, {
            $set: {
                rating: rating
            }
        })
    })

});

bot.command('chat', async (ctx) => { await ctx.scene.enter('chatgpt') })
bot.command('home', async (ctx) => { await ctx.scene.enter('home') })

// bot.on("inline_query", async (ctx) => {

//     const query = ctx.inlineQuery.query

//     console.log(query)
    
//     const results: InlineQueryResult[] = [
//         {
//             type: 'document',
//             id: '1',
//             title: 'Результат 1',
//             input_message_content: {
//                 message_text: 'Это результат 1'
//             },
//         },
//         // Добавьте другие результаты поиска
//     ];

//     // @ts-ignore
//     await ctx.answerInlineQuery(results, {});

// })