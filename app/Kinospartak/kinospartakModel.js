'use strict'

const request = require('request-promise');
const htmlparser = require('htmlparser2');
const fs = require('fs');
const config = require('../../config');

const KINOSPATAK_URL = 'http://kinospartak.ru';
const SCHEDULE_PATH = '/billboard/schedule/';
const SCHEDULE_FILE = './schedule.json';

function _setStorageMemjs() {
  const memjs = require('memjs');

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
    }).then(data => JSON.parse(data)).catch(reason => console.error(reason));
  };

  exports.saveSchedule = (schedule) => {
    return new Promise(function(resolve, reject) {
      memjsClient.set('schedule', JSON.stringify(schedule));
    }).catch(reason => console.error(reason));
  };
}

function _setStorageFs() {
  exports.loadSchedule = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(SCHEDULE_FILE, {encoding: 'utf8'}, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return resolve('[]');
          } else {
            return reject(err);
          }
        };
        resolve(data);
      })
    }).then(data => JSON.parse(data)).catch(reason => console.error(reason));
  };

  exports.saveSchedule = (schedule) => {
    return new Promise(function(resolve, reject) {
      fs.writeFile(SCHEDULE_FILE, JSON.stringify(schedule), (err) => {
        if (err) {
          return reject(err);
        };
      })
    }).catch(reason => console.error(reason));
  };
}

function _filterDates(elem) {
  return (elem.type === 'tag' && elem.name === 'h2' && elem.attribs.id);
};

function _parseMovies(movieNodes) {
  return movieNodes.children.map(movieNode => {
    const movieDescNode = movieNode.children[0].children[0].children[0];
    const movie = {
      name: movieDescNode.children[0].children[0].data,
      url: KINOSPATAK_URL + movieDescNode.children[0].attribs.href
    };
    if (movieDescNode.next) {
      movie.category = movieDescNode.next.children[0].data;
    };
    return movie;
  })
};

exports.getSchedule = () => {
  return request(KINOSPATAK_URL + SCHEDULE_PATH)
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

switch (config.STORAGE_TYPE) {
  case 'memjs':
    _setStorageMemjs();
    break;
  case 'fs':
    _setStorageFs();
    break;
  default:
    throw new Error('Storage type not specified')
}
