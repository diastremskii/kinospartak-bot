'use strict'

const config = require('../config');
const TelegramBot = require('node-telegram-bot-api');
const options = {
  webHook: {
    port: config.PORT
  }
};

const bot = new TelegramBot(config.TOKEN, options);

bot.setWebHook(`${config.BOT_URL}/bot${config.TOKEN}`);

bot.on('message', function onMessage(msg) {
  bot.sendMessage(msg.chat.id, 'Yay!');
});
