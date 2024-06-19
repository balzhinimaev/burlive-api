import express from "express";
import telegramController from "../controllers/telegramController";

const payRouter = express.Router();

payRouter.post("/", telegramController.create);

export default payRouter;
