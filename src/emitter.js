import { nameFromLevel, resolveLevel } from 'bunyan';

function emitter(stream, level) {
  return function() {
    const _level = nameFromLevel[resolveLevel(level)];
    stream[_level](...arguments);
  };
}

module.exports = emitter;
