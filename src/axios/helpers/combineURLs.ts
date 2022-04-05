'use strict';

/**
 * @description 拼接 `baseURL` 和 `relativeURL`
 * 
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
 export default function combineURLs(baseURL: string, relativeURL?: string) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};
