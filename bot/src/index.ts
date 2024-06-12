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
import study from './bot/views/study.scene';
import chat from './bot/views/chat.scene';
import { greeting } from './bot/views/home.scene';
const stage: any = new Scenes.Stage<rlhubContext>([home, study, chat, vocabular, sentences, dashboard, moderation, settings], { default: 'home' });

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

bot.use(session())
bot.use(stage.middleware())
bot.start(async (ctx) => await ctx.scene.enter("home"));

bot.action(/./, async function (ctx: rlhubContext) {
    await ctx.scene.enter('home')
    ctx.answerCbQuery()
    await greeting(ctx, true)
})

bot.command('chat', async (ctx) => { await ctx.scene.enter('chatgpt') })
bot.command('home', async (ctx) => { await ctx.scene.enter('home') })