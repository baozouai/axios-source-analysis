'use strict';

import {forEach} from '../utils';

export default  function normalizeHeaderName(headers, normalizedName) {
  forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};
