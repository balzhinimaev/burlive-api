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
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_sentences_handler = exports.greeting = void 0;
const telegraf_1 = require("telegraf");
const ISentence_1 = require("../../models/ISentence");
const IUser_1 = require("../../models/IUser");
const handler = new telegraf_1.Composer();
const home = new telegraf_1.Scenes.WizardScene("home", handler, (ctx) => __awaiter(void 0, void 0, void 0, function* () { return yield add_sentences_handler(ctx); }));
function greeting(ctx, reply) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield IUser_1.User.findOne({ id: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id });
        if (user) {
            if (user.interface_language) {
                ctx.scene.session.interface_ln = user.interface_language;
            }
            else {
                ctx.scene.session.interface_ln = 'russian';
            }
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
                    // [{ text: "📈 Общая статистика", callback_data: "table" }],
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
            if (reply) {
                return ctx.reply(message[ctx.scene.session.interface_ln], extra);
            }
            // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
            ctx.updateType === 'callback_query' ? yield ctx.editMessageText(message[ctx.scene.session.interface_ln], extra) : ctx.reply(message[ctx.scene.session.interface_ln], extra);
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.greeting = greeting;
home.start((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let ref_user = 0;
    if (ctx.startPayload) {
        ref_user = parseFloat(ctx.startPayload.replace('ref_', ''));
    }
    // await 
    try {
        let document = yield IUser_1.User.findOne({
            id: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id
        });
        if (!document) {
            if (ctx.from) {
                const user = {
                    id: ctx.from.id,
                    username: ctx.from.username,
                    first_name: ctx.from.first_name,
                    translations: [],
                    voted_translations: [],
                    rating: 0,
                    is_bot: false,
                    supported: 0,
                    permissions: {
                        admin: true,
                        translation_moderator: true,
                        sentences_moderator: true,
                        dictionary_moderator: true
                    },
                };
                yield new IUser_1.User(user).save().catch(err => {
                    console.log(err);
                });
                yield greeting(ctx);
            }
        }
        else {
            yield greeting(ctx);
        }
    }
    catch (err) {
        console.log(err);
    }
}));
home.action("vocabular", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.answerCbQuery();
    return ctx.scene.enter('vocabular');
}));
home.action("sentences", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    return ctx.scene.enter('sentences');
}));
home.action("translater", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let message = `<b>План по развитию Бурятского языка</b> \n\n`;
    message += `<a href="https://telegra.ph/Znachimost-Mashinnogo-Perevodchika-dlya-Buryatskogo-YAzyka-09-01">На данный момент отсутствует машинный переводчик с Бурятского языка, над чем мы и работаем</a>\n`;
    yield ctx.editMessageText(message, { parse_mode: 'HTML', disable_web_page_preview: true });
    yield greeting(ctx, true);
    return ctx.answerCbQuery('На стадии разработки 🎯');
}));
home.action("study", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('study');
    return ctx.answerCbQuery('Программа обучения на стадии разработки 🎯');
}));
home.action("moderation", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f;
    try {
        if (ctx.updateType === 'callback_query') {
            const user = yield IUser_1.User.findOne({ id: (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id });
            if (((_c = user === null || user === void 0 ? void 0 : user.permissions) === null || _c === void 0 ? void 0 : _c.admin) || ((_d = user === null || user === void 0 ? void 0 : user.permissions) === null || _d === void 0 ? void 0 : _d.dictionary_moderator) || ((_e = user === null || user === void 0 ? void 0 : user.permissions) === null || _e === void 0 ? void 0 : _e.sentences_moderator) || ((_f = user === null || user === void 0 ? void 0 : user.permissions) === null || _f === void 0 ? void 0 : _f.translation_moderator)) {
                ctx.answerCbQuery('Есть права!');
                return ctx.scene.enter('moderation');
            }
            else {
                ctx.answerCbQuery('Недостаточно прав');
                yield ctx.editMessageText('Чтобы получить права модератора, напишите администратору @frntdev');
                yield delay(1500);
                return yield greeting(ctx, true);
            }
        }
    }
    catch (error) {
        console.error(error);
    }
    // ctx.answerCbQuery()
    // return ctx.scene.enter('moderation')
}));
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
home.action("chatgpt", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.answerCbQuery();
    return ctx.scene.enter('chatgpt');
}));
home.action("dashboard", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.answerCbQuery('Личный кабинет');
    return ctx.scene.enter('dashboard');
}));
home.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () { return yield greeting(ctx); }));
home.command('add_sentences', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Отправьте список предложений на русском которые хотите добавить в базу данных для их перевода в дальнейшем');
    ctx.wizard.selectStep(1);
}));
home.command("reset_activet", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ISentence_1.Sentence.updateMany({
        active_translator: []
    });
}));
function add_sentences_handler(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ctx.from) {
            try {
                if (ctx.updateType === 'callback_query') {
                    if (ctx.callbackQuery) {
                        // @ts-ignore
                        if (ctx.callbackQuery.data) {
                            // @ts-ignore
                            let data = ctx.callbackQuery.data;
                            // сохранение предложенных предложений
                            if (data === 'send_sentences') {
                                for (let i = 0; i < ctx.session.sentences.length; i++) {
                                    new ISentence_1.Sentence({
                                        text: ctx.session.sentences[i],
                                        author: ctx.from.id,
                                        accepted: 'not view',
                                        translations: [],
                                        skipped_by: []
                                    }).save().then((data) => __awaiter(this, void 0, void 0, function* () {
                                        var _a;
                                        let object_id = data._id;
                                        yield IUser_1.User.findOneAndUpdate({ id: (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id }, { $push: {
                                                "proposedProposals": object_id
                                            } });
                                    }));
                                }
                                yield ctx.answerCbQuery(`${ctx.session.sentences} отправлены на проверку, спасибо!`);
                                ctx.wizard.selectStep(0);
                                yield greeting(ctx);
                            }
                            if (data === 'back') {
                                ctx.wizard.selectStep(0);
                                yield ctx.answerCbQuery();
                                return greeting(ctx);
                            }
                        }
                    }
                }
                else if (ctx.updateType === 'message') {
                    if (ctx.update.message.text) {
                        let text = ctx.update.message.text;
                        const user = yield IUser_1.User.findOne({ id: ctx.from.id });
                        if (!user || !user._id) {
                            return false;
                        }
                        let sentence = {
                            text: text.toLocaleLowerCase(),
                            author: user._id,
                            accepted: 'not view',
                            translations: [],
                            skipped_by: [],
                            active_translator: []
                        };
                        let message = ``;
                        if (sentence.text.indexOf('+;') !== -1) {
                            let splitted = sentence.text.split('+;');
                            let arr = [];
                            for (let i = 0; i < splitted.length; i++) {
                                arr.push(splitted[i].trimEnd().trimStart());
                            }
                            ctx.session.sentences = arr;
                            for (let i = 0; i < splitted.length; i++) {
                                message += `${i + 1}) ${splitted[i].trimStart().trimEnd()}\n`;
                            }
                        }
                        else {
                            ctx.session.sentences = [text];
                            message += text;
                        }
                        yield ctx.reply(message, {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Сохранить',
                                            callback_data: 'send_sentences'
                                        }
                                    ],
                                    [
                                        {
                                            text: 'Назад',
                                            callback_data: 'back'
                                        }
                                    ]
                                ]
                            }
                        });
                    }
                    else {
                        yield ctx.reply("Нужно отправить в текстовом виде");
                    }
                }
            }
            catch (err) {
                ctx.wizard.selectStep(0);
                yield greeting(ctx);
            }
        }
    });
}
exports.add_sentences_handler = add_sentences_handler;
// home.on("message", async (ctx) => await greeting (ctx))
home.action(/\./, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(ctx);
    yield greeting(ctx);
}));
exports.default = home;
//# sourceMappingURL=home.scene.js.map