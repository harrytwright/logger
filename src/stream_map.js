import { Writable } from 'stream';

import _ from 'lodash';
import { RingBuffer } from 'bunyan';

function StreamMap() {
  this.map = [];
}

StreamMap.prototype.saveStreamsForLogger = function(logger) {
  logger.streams
    .map((el) => el.stream)
    .filter((el) => el instanceof Writable || RingBuffer)
    .forEach((stream) => {
      this.set(stream);
    });
};

StreamMap.prototype.set = function(stream) {
  this.map.push(stream);
  this.map = _.uniqBy(this.map);

  return this;
};

StreamMap.prototype.values = function() {
  return this.map;
};

module.exports = new StreamMap();
