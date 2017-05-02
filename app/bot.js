'use strict'

const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const Kinospartak = require('./Kinospartak/Kinospartak');
const utils = require('./utils');

const options = {
  webHook: {
    port: config.PORT
  }
};

const bot = new TelegramBot(config.TOKEN, options);
const kinospartak = new Kinospartak(1000 * 60 * 30); //Update every 30 minutes

bot.setWebHook(`${config.BOT_URL}/bot${config.TOKEN}`);

bot.onText(/\/today/, (msg) => {
  kinospartak.getSchedule()
    .then(schedule => utils.formatSchedule(schedule[0]))
    .then(message =>
      bot.sendMessage(msg.chat.id, message, {parse_mode: 'HTML'}))
    .catch(err => bot.sendMessage(msg.chat.id, config.ERROR_MSG));
});

bot.onText(/\/tomorrow/, (msg) => {
  kinospartak.getSchedule()
    .then(schedule => utils.formatSchedule(schedule[1]))
    .then(message =>
      bot.sendMessage(msg.chat.id, message, {parse_mode: 'HTML'}))
    .catch(err => bot.sendMessage(msg.chat.id, config.ERROR_MSG));
});

bot.onText(/\/news/, (msg) => {
  kinospartak.getNews()
    .then(news => utils.formatNews(news))
    .then(messages =>
      utils.sendInOrder(bot, msg.chat.id, messages))
    .catch(err => bot.sendMessage(msg.chat.id, config.ERROR_MSG));
});
