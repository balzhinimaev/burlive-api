// financeRouter.ts
import express from 'express';
import financeController from "../controllers/financeController";

const financeRouter = express.Router();

// Маршрут для получения всех предложений
financeRouter.post("/", financeController.create);
financeRouter.get("/save", financeController.save);
financeRouter.get("/:id", financeController.userdata)

export default financeRouter;
