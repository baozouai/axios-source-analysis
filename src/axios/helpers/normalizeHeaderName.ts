'use strict';

import { AxiosRequestHeaders } from '../type';
import { forEach } from '../utils';
/**
 * @description: 规格化请求头字段名
 * @param {AxiosRequestHeaders} headers 请求头
 * @param {string} normalizedName 要规格化的字段名
 * 
 * @example
 * const headers = { accept: 'xxx', ... } => headers = { Accept: 'xxx', ... }
 * 
 */
export default function normalizeHeaderName(headers: AxiosRequestHeaders, normalizedName: string) {
  // 这里如果找到了要规格化的字段，那么替换为normalizedName，删除原先的
  // 但这里找到后可以直接跳出循环，而不是还继续找，没必要，用try catch来跳出
  forEach(headers, function processHeader(value, name) {
    name = name as string
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};
