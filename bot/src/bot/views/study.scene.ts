import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import greeting from "./studyView/greeting";
import help_handler, { spb } from "./dashboardView/helpHandler";
const handler = new Composer<rlhubContext>();
const scene = new Scenes.WizardScene("study", handler,
    async (ctx) => await help_handler(ctx)
);

scene.enter(async (ctx: rlhubContext) => await greeting(ctx));
scene.action("history", async (ctx: rlhubContext) => await ctx.answerCbQuery("На стадии разработки"));
scene.action("back", async (ctx: rlhubContext) => ctx.scene.enter("home"));

export default scene