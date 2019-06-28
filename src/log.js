import _ from 'lodash';
import { INFO, resolveLevel, levelFromName } from 'bunyan';

import emitter from './emitter';

function Log(stream) {
  this.stream = stream;

  // eslint-disable-next-line consistent-this
  const self = this;
  function log(message, object, level) {
    // console.log(message, object, level);
    if (typeof object === 'string' || typeof object === 'number') {
      level = object;
      object = { };
    }

    let newObject = _.cloneDeep(object || { });
    if (newObject.hasOwnProperty('type')) {
      level = newObject.type;
      delete newObject.type;
    }

    if ((newObject instanceof Error)) {
      level = 'error';
    }

    if (!(newObject instanceof Error) && newObject.hasOwnProperty('message')) {
      message = newObject.message;
      delete newObject.message;
    }

    if (level === 'error') {
      newObject = newObject instanceof Error ? newObject : new Error(newObject.message);
    }

    return emitter(self.stream, resolveLevel(level || INFO))(newObject, message);
  }

  Object.keys(levelFromName).forEach(function(name) {
    log[name] = emitter(self.stream, resolveLevel(name));
  });

  return log;
}


module.exports = Log;
