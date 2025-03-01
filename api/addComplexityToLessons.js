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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var dotenv_1 = require("dotenv");
var Lesson_1 = require("./src/models/Lesson");
dotenv_1.default.config();
// Проверка наличия переменной окружения MONGO_URL
if (!process.env.MONGO_URL) {
    console.error('Ошибка: Переменная окружения MONGO_URL не установлена.');
    process.exit(1);
}
// Маппинг заголовков и сложности
var titleToComplexity = {
    "Таблица гласных": 1,
    "Сингармонизм": 1.5,
    "Слоги": 2,
    "Ударения": 2.5,
    "Морфологический строй": 3,
    "Словообразование": 2.5,
    "Основа слова": 2,
    "Суффиксы бурятского": 1.5,
    "Части речи": 1,
    "Склонение": 3,
    "Дифтонги": 2.5,
    "Краткие гласные": 1,
    "Долгие гласные": 2,
    "Йотированные гласные": 1.5,
    "Характеристика звуков": 2,
};
// Функция для обновления уровня сложности
function updateComplexityByTitle() {
    return __awaiter(this, void 0, void 0, function () {
        var lessons, i, lesson, complexity, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, 9, 11]);
                    // Подключение к базе данных
                    return [4 /*yield*/, mongoose_1.default
                            .connect(process.env.MONGO_URL, {
                            dbName: 'burlive',
                        })
                            .then(function () {
                            console.log('Подключено к базе данных');
                        })
                            .catch(function (error) {
                            console.error('Ошибка при подключении к базе данных:', error);
                        })];
                case 1:
                    // Подключение к базе данных
                    _a.sent();
                    console.log('Подключено к базе данных.');
                    return [4 /*yield*/, Lesson_1.default.find()];
                case 2:
                    lessons = _a.sent();
                    console.log("\u041D\u0430\u0439\u0434\u0435\u043D\u043E ".concat(lessons.length, " \u0443\u0440\u043E\u043A\u043E\u0432."));
                    if (lessons.length === 0) {
                        console.log('Нет уроков для обновления.');
                        return [2 /*return*/];
                    }
                    i = 0;
                    _a.label = 3;
                case 3:
                    if (!(i < lessons.length)) return [3 /*break*/, 7];
                    lesson = lessons[i];
                    complexity = titleToComplexity[lesson.title];
                    if (!complexity) return [3 /*break*/, 5];
                    return [4 /*yield*/, Lesson_1.default.updateOne({ _id: lesson._id }, { $set: { complexity: complexity } })];
                case 4:
                    _a.sent();
                    console.log("\u0423\u0440\u043E\u043A '".concat(lesson.title, "' \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D \u0441 \u0443\u0440\u043E\u0432\u043D\u0435\u043C \u0441\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u0438 ").concat(complexity, "."));
                    return [3 /*break*/, 6];
                case 5:
                    console.log("\u0423\u0440\u043E\u043A '".concat(lesson.title, "' \u043D\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D (\u0441\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u0430 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430)."));
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 3];
                case 7:
                    console.log('Обновление завершено.');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error('Произошла ошибка:', error_1);
                    return [3 /*break*/, 11];
                case 9: 
                // Закрытие соединения с базой данных
                return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 10:
                    // Закрытие соединения с базой данных
                    _a.sent();
                    console.log('Соединение с базой данных закрыто.');
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Запуск функции
updateComplexityByTitle();
