'use strict';

import { AxiosRequestHeaders } from '../type';
import { forEach } from '../utils';

export default function normalizeHeaderName(headers: AxiosRequestHeaders, normalizedName: string) {
  forEach(headers, function processHeader(value, name) {
    name = name as string
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};
