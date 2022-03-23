'use strict';

import { forEach, trim } from './../utils';

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
const ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * @description 解析header为对象
 * 
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 * 
 * @example
 * parseHeaders(
 *  `Date: Wed, 27 Aug 2014 08:58:49 GMT
 *  set-cookie: xxx
 *  set-cookie: www
 *  Date: Wed, 27 Aug 2014 08:58:49 xxx
 *  Content-Type: application/json
 *  Connection: keep-alive
 *  Transfer-Encoding: chunked`
 *  )
 * 
 * {
 *  date: "Wed, 27 Aug 2014 08:58:49 GMT, Wed, 27 Aug 2014 08:58:49 xxx",
 *  set-cookie: [
 *      "xxx",
 *      "www"
 *  ],
 *  content-type: "application/json",
 *  connection: "keep-alive",
 *  transfer-encoding: "chunked"
 * }
 */
export default function parseHeaders(headers?: string) {
  const parsed: Record<string, any> = {};
  let key;
  let val;
  let i;
  // 如果没有headers，那么返回空对象
  if (!headers)  return parsed;
  // 响应头都是以回车键分隔的key:value,所有这里先split下
  forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    // 获取key和val，key改为小写，且去掉头尾空字符串
    key = trim(line.substr(0, i)).toLowerCase();
    val = trim(line.substr(i + 1));

    if (key) {
      // 如果已经有该key且该key是要忽略的，那么不添加到result上
      if (parsed[key] && ignoreDuplicateOf.includes(key)) {
        return;
      }
      // 如果是set-cookie，那么需要放到数组里
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] || []).concat([val]);
      } else {
        // 相同key要用', '分隔
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};
