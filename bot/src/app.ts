import express from "express";
import bodyParser from "body-parser";
import { bot } from "./index";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

export const secretPath = `/telegraf/secret_path`;

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

app.post(secretPath, (req, res) => {
  bot.handleUpdate(req.body, res);
});

app.get("/", (req, res) => res.send("Бот запущен!"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fetchData = async () => {
  const res = await fetch("http://127.0.0.1:4040/api/tunnels");
  const json = await res.json();
  const secureTunnel = json.tunnels[0].public_url;
  console.log(secureTunnel);
  await bot.telegram.setWebhook(`${secureTunnel}${secretPath}`).then((res) => {
    console.log(res);
  });
};

const setWebhook = async () => {
  if (process.env.MODE === "production") {
    await bot.telegram
      .setWebhook(process.env.WEBHOOK_URL)
      .then((status) => {
        console.log(`Webhook URL: ${process.env.WEBHOOK_URL}`);
        console.log(status);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    await fetchData().catch((error) => {
      console.error("Error setting webhook:", error);
    });
  }
};
// Функция для подключения к базе данных
const connectToDB = async () => {
  try {
    console.log(`Подключение к бд`)
    await mongoose.connect(process.env.DB_CONNECTION_STRING!, {
      dbName: "burlive"
    });
    console.log("Успешное подключение к базе данных");
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
  }
};

(async () => {
  try {
    await setWebhook();
    await connectToDB();
  } catch (error) {
    console.log(error);
  }
})();
