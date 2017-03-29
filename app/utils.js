/**
 * formatSchedule - format schedule objects to Telegram HTML messages
 *
 * @param  {Schedule|Schedule[]} schedule  movie schedule
 * @return {String[]}          array of html marked up messages
 * @see Kinospartak class for Schedule definition
 */
exports.formatSchedule = (schedule) => {
  if (!(schedule instanceof Array)) {
    return schedule.movies.reduce(formatMovies, `<b>${schedule.date}</b>`)
  }
  return schedule.map((day) => {
    return day.movies.reduce(formatMovies, `<b>${day.date}</b>`)
  });
}

/**
 * sendInOrder - send array of messages to channel in consecutive order
 *
 * @param {Object} bot Telegram bot API handler
 * @param {Number|String} chatId Unique identifier for the message recipient
 * @param  {String[]} messages array of strings to send
 * @return {Promise}
 */
exports.sendInOrder = (bot, chatId, messages) => {
  return messages.reduce((acc, message) => {
    return acc.then(() => {
      return bot.sendMessage(chatId, message, {parse_mode: 'HTML'});
    })
  }, Promise.resolve())
}

/**
 * formatNews - format news to Telegram HTML messages
 *
 * @param  {Object|Object[]} news array of news
 * @return {String[]}      array of html marked up messages
 */
exports.formatNews = (news) => {
  if (!(news instanceof Array)) {
    return `<a href="${news.link}">${news.title}</a>\n${news.description}`
  }
  return news.map((news) => {
    let message = '';
    message += `<a href="${news.link}">${news.title}</a>`;
    message += `\n${news.description}`;
    return message;
  });
}

function formatMovies(message, movie) {
  message += `\n<a href="${movie.url}">${movie.name}</a>`;
  if (movie.category) {
    message += `\n<i>${movie.category}</i>`
  };
  return message;
}
