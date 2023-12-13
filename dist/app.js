"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.secretPath = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const index_1 = require("./index");
const morgan = require("morgan");
const PORT = process.env.PORT;
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.secretPath = `/telegraf/burlang`;
app.use(body_parser_1.default.json());
app.use((req, res, next) => {
    console.log(req.path);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});
const privateKey = fs_1.default.readFileSync('./ssl/privkey.pem', 'utf8');
const certificate = fs_1.default.readFileSync('./ssl/fullchain.pem', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
};
// Настройка CORS
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.post(`/telegraf/burlang`, (req, res) => {
    index_1.bot.handleUpdate(req.body, res);
});
app.get("/", (req, res) => res.send("Бот запущен!"));
app.use(morgan("dev"));
app.use(express_1.default.json());
// app.use(cors(corsOptions));
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
    const { default: fetch } = yield Promise.resolve().then(() => __importStar(require('node-fetch')));
    const res = yield fetch('http://127.0.0.1:4040/api/tunnels');
    //@ts-ignore
    // console.log(await res.json().tu)
    const json = yield res.json();
    // console.log(json)
    //@ts-ignore
    const secureTunnel = json.tunnels[0].public_url;
    console.log(secureTunnel);
    yield index_1.bot.telegram.setWebhook(`${secureTunnel}${exports.secretPath}`)
        .then(res => {
        console.log(res);
    });
});
function set_webhook() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${(_a = process.env.mode) === null || _a === void 0 ? void 0 : _a.replace(/"/g, '')}`);
        if (`${(_b = process.env.mode) === null || _b === void 0 ? void 0 : _b.replace(/"/g, '')}` === "production") {
            console.log(`${(_c = process.env.mode) === null || _c === void 0 ? void 0 : _c.replace(/"/g, '')}`);
            console.log(`prod secret path: ${exports.secretPath}`);
            yield index_1.bot.telegram.setWebhook(`https://drvcash.com/telegraf/burlang`)
                .then((status) => {
                console.log(exports.secretPath);
                console.log(status);
            }).catch(err => {
                console.log(err);
            });
        }
        else {
            yield fetchData().catch((error) => {
                console.error('Error setting webhook:', error);
            });
        }
    });
}
;
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield set_webhook();
            // await sendRequest('голова болит').then(res => { console.log(res.data.choices[0].message.content) })
        }
        catch (error) {
            console.log(error);
        }
    });
})();
//# sourceMappingURL=app.js.map