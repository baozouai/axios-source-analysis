'use strict';

import  data  from '../env/data';
const VERSION = data.version
type ValidatorType = 'object'| 'boolean'| 'number'| 'function'| 'string'| 'symbol'

function validator(type: ValidatorType, thing: string, isAn?:  boolean): true | string {
  return typeof thing === type || 'a' + (isAn ? 'n ' : ' ') + type;
}

const deprecatedWarnings: Record<string, boolean> = {};

const validators = {
  /**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
  transitional(validator, version?: string, message?: string) {
    function formatMessage(opt: string, desc: string) {
      return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
    }
  
    return function(value: ValidatorType, opt: string, opts: string) {
      if (validator === false) {
        throw new Error(formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')));
      }
  
      if (version && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        // eslint-disable-next-line no-console
        console.warn(
          formatMessage(
            opt,
            ' has been deprecated since v' + version + ' and will be removed in the near future'
          )
        );
      }
  
      return validator ? validator(value, opt, opts) : true;
    };
  },
  object(thing: string) {
    return validator('object', thing, true)
  },
  boolean(thing: string) {
    return validator('boolean', thing)
  },
  number(thing: string) {
    return validator('number', thing)
  },
  function(thing: string) {
    return validator('function', thing)
  },
  string(thing: string) {
    return validator('string', thing)
  },
  symbol(thing: string) {
    return validator('symbol', thing)
  },
};





/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown?: boolean) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new TypeError('option ' + opt + ' must be ' + result);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw Error('Unknown option ' + opt);
    }
  }
}

export default {
  assertOptions,
  validators
};
