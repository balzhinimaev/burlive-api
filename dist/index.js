"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const telegraf_1 = require("telegraf");
dotenv_1.default.config();
exports.bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
require("./app");
require("./webhook");
require("./database");
const home_scene_1 = __importDefault(require("./bot/views/home.scene"));
const sentences_scene_1 = __importDefault(require("./bot/views/sentences.scene"));
const settings_scene_1 = __importDefault(require("./bot/views/settings.scene"));
const dashboard_scene_1 = __importDefault(require("./bot/views/dashboard.scene"));
const vocabular_scene_1 = __importDefault(require("./bot/views/vocabular.scene"));
const moderation_scene_1 = __importDefault(require("./bot/views/moderation.scene"));
const chat_scene_1 = __importDefault(require("./bot/views/chat.scene"));
const ISentence_1 = require("./models/ISentence");
const IUser_1 = require("./models/IUser");
const home_scene_2 = require("./bot/views/home.scene");
const stage = new telegraf_1.Scenes.Stage([home_scene_1.default, chat_scene_1.default, vocabular_scene_1.default, sentences_scene_1.default, dashboard_scene_1.default, moderation_scene_1.default, settings_scene_1.default], { default: 'home' });
console.log('hi');
function ps_greeting(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        let users = yield IUser_1.User.find();
        if (users) {
            users.forEach((user) => __awaiter(this, void 0, void 0, function* () {
                if (user.interface_language) {
                    ctx.scene.session.interface_ln = user.interface_language;
                }
                else {
                    ctx.scene.session.interface_ln = 'russian';
                }
                let keyboard_translates = {
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
                };
                const extra = {
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
                };
                let message = {
                    russian: `Самоучитель бурятского языка \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nВыберите раздел, чтобы приступить`,
                    buryat: `Буряд хэлэнэ заабари \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nЭхилхиин, нэгэ юумэ дарагты`,
                    english: `Buryat Language Tutorial \n\nEvery interaction with the bot affects the preservation and further development of the Buryat language \n\nChoose a section to start`,
                };
                try {
                    // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
                    ctx.updateType === 'callback_query' ? yield ctx.editMessageText(message[ctx.scene.session.interface_ln], extra) : ctx.reply(message[ctx.scene.session.interface_ln], extra);
                }
                catch (err) {
                    console.log(err);
                }
            }));
        }
    });
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
home_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
chat_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
vocabular_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
sentences_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
dashboard_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
moderation_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
settings_scene_1.default.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
home_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
chat_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
vocabular_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
sentences_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
dashboard_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
moderation_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
settings_scene_1.default.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
home_scene_1.default.command(`hi`, (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.reply('hi'); }));
home_scene_1.default.command('get_users', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let user = yield IUser_1.User.findOne({
        id: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id
    });
    if ((_b = user === null || user === void 0 ? void 0 : user.permissions) === null || _b === void 0 ? void 0 : _b.admin) {
        let users = yield IUser_1.User.find();
        let stats = {
            count: users.length
        };
        let message = ``;
        message += `Количество пользователей: ${stats.count}\n`;
        message += `/list\n`;
        message += `/sendemail\n`;
        return ctx.reply(message);
    }
    else {
        return ctx.reply('Прав нет!');
    }
}));
home_scene_1.default.command('list', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield IUser_1.User.find();
    let message = ``;
    users.forEach((element, index) => __awaiter(void 0, void 0, void 0, function* () {
        message += `${index}) `;
        if (element.username) {
            message += `@${element.username} `;
        }
        if (element.first_name) {
            message += `<i>${element.first_name}</i>`;
        }
        message += `\n`;
    }));
    yield ctx.reply(message, { parse_mode: 'HTML' });
}));
// права админа
home_scene_1.default.command('add_permissions', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    return yield IUser_1.User.findOneAndUpdate({
        id: (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id
    }, {
        $set: {
            permissions: {
                admin: true
            }
        }
    }).then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield ctx.reply('права переданы');
    })).catch((error) => __awaiter(void 0, void 0, void 0, function* () {
        yield ctx.reply('возникла ошибка');
        console.error(error);
    }));
}));
exports.bot.use((0, telegraf_1.session)());
exports.bot.use(stage.middleware());
exports.bot.start((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.scene.enter('home');
    // ctx.deleteMessage(874)
}));
exports.bot.action(/./, function (ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        // await ctx.scene.enter('home')
        ctx.answerCbQuery();
        yield (0, home_scene_2.greeting)(ctx, true);
    });
});
exports.bot.command('update_translates_collection', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let translates = yield ISentence_1.Translation.find();
    translates.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
        let votes = element.votes;
        let rating = 0;
        if (votes) {
            let pluses = 0;
            let minuses = 0;
            for (let i = 0; i < votes.length; i++) {
                let voteDocument = yield ISentence_1.voteModel.findById(votes[i]);
                if (voteDocument) {
                    if (voteDocument.vote === true) {
                        pluses++;
                    }
                    else {
                        minuses++;
                    }
                }
            }
            rating = pluses - minuses;
        }
        yield ISentence_1.Translation.findByIdAndUpdate(element._id, {
            $set: {
                rating: rating
            }
        });
    }));
}));
exports.bot.command('chat', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('chatgpt'); }));
exports.bot.command('home', (ctx) => __awaiter(void 0, void 0, void 0, function* () { yield ctx.scene.enter('home'); }));
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
//# sourceMappingURL=index.js.map