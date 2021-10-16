'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
class Cancel {
  message = ''
  __CANCEL__ = true
  constructor(message = '') {
    this.message = message;
  }

  toString() {
    return 'Cancel' + (this.message ? ': ' + this.message : '');
  }
}

export default Cancel;
