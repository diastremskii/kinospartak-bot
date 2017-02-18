'use strict'

const config = require('../config');
const TelegramBot = require('node-telegram-bot-api');
const Kinospartak = require('./Kinospartak/Kinospartak');

const bot = new TelegramBot(config.TOKEN);

const kinospartak = new Kinospartak();

/**
 * scheduleToMessages - convert schedule objects to Telegram HTML messages
 *
 * @param  {Schedule[]} schedule  movie schedule
 * @return {String[]}          array of html marked up messages
 * @see Kinospartak class for Schedule definition
 */
function scheduleToMessages(schedule) {
  return schedule.map((day) => {
    return day.movies.reduce((message, movie) => {
      message += `\n<a href="${movie.url}">${movie.name}</a>`;
      if (movie.category) {
        message += `\n<i>${movie.category}</i>`
      };
      return message;
    }, `<b>${day.date}</b>`)
  });
}

/**
 * sendInOrder - send array of messages to channel in consecutive order
 *
 * @param  {String[]} messages array of strings to send
 * @return {Promise}
 */
function sendInOrder(messages) {
  return messages.reduce((acc, message) => {
    return acc.then(() => {
      return bot.sendMessage(config.CHANNEL, message, {parse_mode: 'HTML'});
    })
  }, Promise.resolve())
}

/**
 * updateSchedule - update schedule and push updates to Telegram channel
 *
 * @return {Promise}
 */
function updateSchedule() {
  return kinospartak.getChanges()
    .then(changes =>
      changes.length ? scheduleToMessages(changes) : Promise.reject('No changes'))
    .then(messages => sendInOrder(messages))
    .then(() => kinospartak.commitChanges())
};

updateSchedule()
  .catch(error => console.error(error))
