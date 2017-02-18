'use strict'

const kinospartakModel = require('./kinospartakModel');
/**
 * Represents movie schedule for one day
 * @typedef {Object} Schedule
 * @property {String} date - movies date
 * @property {Object[]} movies - array of movies
 * @property {String} movies[].name - movie name
 * @property {String} movies[].url - movie url
 * @property {String} [movies[].category] - movie category
 */

/**
 * @class Kinospartak controller
 * @type {Object}
 *
 */
module.exports = class Kinospartak {
  constructor() {

  };

  /**
   * getSchedule - get schedule from model or cache
   *
   * @return {Promise}     resolves to schedule
   */
  getSchedule() {
    if (this.schedule) {
      return Promise.resolve(this.schedule);
    };
    return kinospartakModel.getSchedule()
      .then(schedule => this.schedule = schedule)
  };

  /**
   * getChanges - get diff between saved schedule and new schedule
   *
   * @return {Promise}  resolves to schedule
   */
  getChanges() {
    return Promise.all([
      this.getSchedule(),
      this._getOldSchedule()
    ])
      .then(([schedule, oldSchedule]) =>
        this._diffSchedule(schedule, oldSchedule));
  };

  /**
   * commitChanges - save changes to storage
   *
   * @return {Promise}  resolves to undefined
   */
  commitChanges() {
    kinospartakModel.saveSchedule(this.schedule);
  };

  /**
   * _getOldSchedule - get schedule from storage
   *
   * @return {Promise}  resolves to schedule
   * @private
   */
  _getOldSchedule() {
    if (this.oldSchedule) {
      return Promise.resolve(this.oldSchedule);
    };
    return kinospartakModel.loadSchedule()
      .then(schedule => this.oldSchedule = schedule);
  };

  /**
   * _diffSchedule - compare two schedules and return additions to old one
   *
   * @param  {Schedule[]} schedule    new schedule
   * @param  {Schedule[]} oldSchedule old schedule
   * @return {Schedule[]}             additions to old schedule
   * @private
   */
  _diffSchedule(schedule, oldSchedule) {
    const additions = [];
    schedule.forEach((day) => {
      const oldDateIndex = oldSchedule.findIndex((oldDay) => {
        return (oldDay.date === day.date)
      });
      if (oldDateIndex < 0) {
        return additions.push(day);
      };

      let dayPushed = false;
      day.movies.forEach((movie) => {
        const oldMovieIndex = oldSchedule[oldDateIndex].movies.findIndex((oldMovie) => {
          return (oldMovie.name === movie.name)
        });
        if (oldMovieIndex < 0) {
          if (!dayPushed) {
            dayPushed = true;
            additions.push({
              date: day.date,
              movies: []
            });
          };
          additions[additions.length - 1].movies.push(movie);
        };
      })
    });
    return additions;
  };
};
