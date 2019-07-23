import _ from 'lodash';

import Log from './log';
import { debug } from './utils';
// import _streams from './stream_map';

function Namespace(base) {
  this.base = base;

  // eslint-disable-next-line consistent-this
  const self = this;
  /**
   * > Adding custom streams:
   *    Set options.streams to any bunyan streams...
   * */
  function namespace(namespace, level, options) {
    if (namespace === null) {
      throw new Error('No options have been set for the logger tool');
    }

    let opts = _.clone(options || {});
    if (typeof namespace === 'object') {
      opts = namespace;
    } if (level && typeof level === 'object') {
      opts.namespace = namespace;
      opts = level;
    } if (level && (typeof level === 'string' || typeof level === 'number')) {
      opts.namespace = namespace;
      opts.level = level;
    } else {
      opts.namespace = namespace;
    }

    debug(`Creating ${namespace} with options`, opts);
    const stream = self.base.logger.child(opts);
    return new Log(stream);
  }
  /**
   * Move bunyan interface methods here
   * */
  namespace.addStream = function() {
    self.base.addStream(...arguments);
  };

  namespace.level = function() {
    debug(arguments.length === 1 ? 'Setting new level' : 'Getting level');
    return self.base.logger.level(...arguments);
  };

  namespace.levels = function() {
    return self.base.logger.levels(...arguments);
  };


  return namespace;
}

module.exports = Namespace;

