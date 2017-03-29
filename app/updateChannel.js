'use strict'

const TelegramBot = require('node-telegram-bot-api');

const config = require('../config');
const utils = require('./utils');
const Kinospartak = require('./Kinospartak/Kinospartak');

const bot = new TelegramBot(config.TOKEN);

const kinospartak = new Kinospartak();

/**
 * updateSchedule - update schedule and push updates to Telegram channel
 *
 * @return {Promise}
 */
function updateSchedule() {
  return kinospartak.getChanges()
    .then(changes =>
      changes.length ?
        utils.formatSchedule(changes) : Promise.reject('No changes'))
    .then(messages => utils.sendInOrder(bot, config.CHANNEL, messages))
    .then(() => kinospartak.commitChanges())
    .catch(error => console.error(error))
};

/**
 * updateNews - update news and push updates to Telegram channel
 *
 * @return {Promise}
 */
function updateNews() {
  return kinospartak.getLatestNews()
    .then(news =>
      news.length ?
        utils.formatNews(news) : Promise.reject('No news'))
    .then(messages => utils.sendInOrder(bot, config.CHANNEL, messages))
    .then(() => kinospartak.setNewsOffset(new Date().toString()))
    .catch(error => console.error(error))
};

Promise.all([
  updateSchedule(),
  updateNews()
])
