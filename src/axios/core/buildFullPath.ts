'use strict';

import isAbsoluteURL from '../helpers/isAbsoluteURL';
import combineURLs from '../helpers/combineURLs';

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 * 
 * @example
 * buildFullPath('https://baozouai.com', 'post') => 'https://baozouai.com/post'
 * buildFullPath('https://baozouai.com', 'https://bilibili.com/post') => 'https://bilibili.com/post'
 */
export default function buildFullPath(baseURL = '', requestedURL = ''): string {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};
