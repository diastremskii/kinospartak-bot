'use strict'

const config = require('../../config');

const request = require('request-promise');
const htmlparser = require('htmlparser2');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const memjs = require('memjs');

const KINOSPARTAK_URL = 'http://kinospartak.ru';
const SCHEDULE_PATH = '/billboard/schedule/';
const SCHEDULE_FILE = './schedule.json';

const memjsClient = memjs.Client.create(config.MEMCACHEDCLOUD_SERVERS, {
  username: config.MEMCACHEDCLOUD_USERNAME,
  password: config.MEMCACHEDCLOUD_PASSWORD
});

exports.loadSchedule = () => {
  return new Promise((resolve, reject) => {
    memjsClient.get('schedule', (err, value, key) => {
      if (value) {
        resolve(value);
      } else {
        resolve('[]')
      };
    })
  }).then(data => JSON.parse(data))
    .catch(reason => console.error(reason));
};

exports.saveSchedule = (schedule) => {
  return new Promise(function(resolve, reject) {
    memjsClient.set('schedule', JSON.stringify(schedule));
  }).catch(reason => console.error(reason));
};

function _filterDates(elem) {
  return (elem.type === 'tag' && elem.name === 'h2' && elem.attribs.id);
};

function _parseMovies(movieNodes) {
  return movieNodes.children.map(movieNode => {
    const movieDescNode = movieNode.children[0].children[0].children[0];
    const movie = {
      name: movieDescNode.children[0].children[0].data,
      url: KINOSPARTAK_URL + movieDescNode.children[0].attribs.href
    };
    if (movieDescNode.next) {
      movie.category = movieDescNode.next.children[0].data;
    };
    return movie;
  })
};

exports.getSchedule = () => {
  return request(KINOSPARTAK_URL + SCHEDULE_PATH)
    .then(body => htmlparser.parseDOM(body))
    .then(dom => htmlparser.DomUtils.findAll(_filterDates, dom))
    .then(dateNodes =>
      dateNodes.map(dateNode => {
        return {
          date: dateNode.children[0].data,
          movies: _parseMovies(dateNode.next.children[0].children[0])
        }
      })
    );
};

const cleanEverything = {
  allowedTags: [],
  allowedAttributes: []
};

exports.getNews = () => {
  return request(`${KINOSPARTAK_URL}/rss`)
    .then(xmlFeed =>
      htmlparser.parseFeed(xmlFeed, {'decodeEntities': true, 'xmlMode': true}))
    .then(feed => feed.items.map(item => {
      item.description = sanitizeHtml(item.description, cleanEverything);
      return item;
    }))
}

exports.getNewsOffset = (date) => {
  return new Promise((resolve, reject) => {
    memjsClient.get('newsOffset', (err, value, key) => {
      if (value) {
        resolve(Date.parse(value));
      } else {
        resolve(new Date(0));
      };
    })
  }).catch(reason => console.error(reason));
};

exports.setNewsOffset = (date) => {
  return new Promise(function(resolve, reject) {
    memjsClient.set('newsOffset', date);
  }).catch(reason => console.error(reason));
};
