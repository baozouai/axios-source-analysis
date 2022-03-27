import Axios from "./core/Axios"
import https from 'https';
import http from 'http';
import {http as httpFollow, https as httpsFollow} from 'follow-redirects';

export type Transport = typeof http | typeof https | typeof httpFollow | typeof httpsFollow
export type AxiosRequestHeaders = Record<string,string> | Record<string, Record<string,string>>

export type AxiosResponseHeaders = Record<string, string> & {
  "set-cookie"?: string[]
}

export interface AxiosRequestTransformer {
  (data: any, headers?: AxiosRequestHeaders): any;
}

export interface AxiosResponseTransformer {
  (data: any, headers?: AxiosResponseHeaders): any;
}

export interface AxiosAdapter {
  (config: AxiosRequestConfig): AxiosPromise<any>;
}

export interface AxiosBasicCredentials {
  username: string;
  password: string;
}

export interface AxiosProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password:string;
  };
  protocol?: string;
}

export type Method =
  | 'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH'
  | 'purge' | 'PURGE'
  | 'link' | 'LINK'
  | 'unlink' | 'UNLINK'

export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'
export interface TransitionalOptions{
  /** 是否忽略JSON.parse(response.body)的错误 */
  silentJSONParsing: boolean;
  /** 当responseType!== json时将是否response转化为json */
  forcedJSONParsing: boolean;
  /** 当请求超时是否返回ETIMEDOUT而不是ECONNABORTED */
  clarifyTimeoutError: boolean;
}
export type responseEncoding =
| 'ascii' | 'ASCII'
| 'ansi' | 'ANSI'
| 'binary' | 'BINARY'
| 'base64' | 'BASE64'
| 'base64url' | 'BASE64URL'
| 'hex' | 'HEX'
| 'latin1' | 'LATIN1'
| 'ucs-2' | 'UCS-2'
| 'ucs2' | 'UCS2'
| 'utf-8' | 'UTF-8'
| 'utf8' | 'UTF8'
| 'utf16le' | 'UTF16LE'
export interface AxiosRequestConfig<D = any> {
  /** 
   * 请求服务器的`url`
   * 
   * @example
   * url: '/user' 
   * */
  url?: string;
  /** 创建请求时使用的方法 */
  method?: Method;
  /** 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL */
  baseURL?: string;
  /**
   * `transformRequest` 允许在向服务器发送前，修改请求数据
   * 它只能用与 'PUT', 'POST' 和 'PATCH' 这几个请求方法
   * 数组中最后一个函数必须返回字符串、Buffer实例、ArrayBuffer、FormData，或 Stream
   * 可以修改请求头。
   * 
   * @example
   * 
   * transformRequest: [function (data, headers) {
   * // 对发送的 data 进行任意转换处理
   *
   * return data;
   * }]
   */
  transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[];
  // transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[];
  /** 
   * @description: `transformResponse` 在传递给 then/catch 前，允许修改响应数据
   * 
   * 
   * 感觉这里只能是数组类型
   * 用于转换response.data的数据，比如:
   * 
   * @example
   * 
   * originData = {created_at: "2010-02-07T18:40:01Z", ...}
   * 
   * const ISO_8601 = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})Z/;
   *  axios.defaults.transformResponse!.concat(function (data, headers) {
   *     Object.keys(data).forEach(function (k) {
   *       if (ISO_8601.test(data[k])) {
   *         data[k] = data[k].split('T')[0];
   *       }
   *     });
   *     return data;
   *   })
   *   那么newData = {created_at: '2010-02-07', ...}
   *  */
  transformResponse?: AxiosResponseTransformer[];
  /** 请求头 */
  headers?: AxiosRequestHeaders;
  /**
   *  `params` 是与请求一起发送的 URL 参数，必须是一个简单对象或 URLSearchParams 对象
   * 
   *  @example
   *   params: {
   *     ID: 12345
   *   }
   */
  params?: Record<string, any> | URLSearchParams;
  /**
   *  `paramsSerializer`是可选方法，主要用于序列化`params`
   * 
   *  @example
   * 
   *  paramsSerializer: function (params) {
   *    return qs.stringify(params, {arrayFormat: 'brackets'})
      }
   */
  paramsSerializer?: (params: any) => string;
  /**
   * `data` 是作为请求体被发送的数据，仅适用 'PUT', 'POST', 'DELETE 和 'PATCH' 请求方法
   * 
   *  在没有设置 `transformRequest` 时，则必须是以下类型之一:
   *  - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
   *  - 浏览器专属: FormData, File, Blob
   *  - Node 专属: Stream, Buffer
   * 
   * @example
   *   data: { firstName: 'Fred' }
   */
  data?: D;
  /**
   *  `timeout` 指定请求超时的毫秒数。如果请求时间超过 `timeout` 的值，则请求会被中断
   *    
   * @example
   * timeout: 1000 //  默认值是 `0` (永不超时)
   */
  timeout?: number;
  /**
   * 超时的提示
   */
  timeoutErrorMessage?: string;
  /**
   * `withCredentials` 表示跨域请求时是否需要使用凭证
   * 
   * @example
   * withCredentials: false, // default
   */
  withCredentials?: boolean;
  /**
   *  `adapter` 允许自定义处理请求，返回一个 promise 并提供一个有效的响应
   * 
   * @example
   * 
   * const settle = require('./../core/settle');
   * 
   * module.exports = function myAdapter(config) {
   * 
   *   return new Promise(function(resolve, reject) {
   *   
   *     const response = {
   *       data: responseData,
   *       status: request.status,
   *       statusText: request.statusText,
   *       headers: responseHeaders,
   *       config: config,
   *       request: request
   *     };
   * 
   *     settle(resolve, reject, response);
   *   });
   * }
   */
  adapter?: AxiosAdapter;
  /**
   * `auth` HTTP Basic Auth
   * 
   * @example
   *  auth: {
   *    username: 'janedoe',
   *    password: 's00pers3cret'
   *  }
   */
  auth?: AxiosBasicCredentials;
  /**
   * `responseType` 表示浏览器将要响应的数据类型
   *  - 选项包括: 'arraybuffer', 'document', 'json', 'text', 'stream'
   *  - 浏览器专属：'blob'
   */
  responseType?: ResponseType;
  /**
   * `responseEncoding` 表示用于解码响应的编码 (Node.js 专属)，注意：忽略 `responseType` 的值为 'stream'，或者是客户端请求
   * 
   * @example
   * responseEncoding: 'utf8', // 默认值
   */
   responseEncoding?: responseEncoding | string & {};
  /** 
   * `xsrfCookieName` 是 xsrf token 的值，被用作 cookie 的名称
   * 
   * @example 
   * xsrfCookieName: 'XSRF-TOKEN', // 默认值
   *  */
  xsrfCookieName?: string;
  /**
   *  `xsrfHeaderName` 是带有 xsrf token 值的http 请求头名称
   * 
   * @example
   *   xsrfHeaderName: 'X-XSRF-TOKEN', // 默认值
   */
  xsrfHeaderName?: string;
  /**
   *   `onUploadProgress` 允许为上传处理进度事件，为浏览器专属
   * 
   * @example
   * onUploadProgress: function (progressEvent) {
   *     // 处理原生进度事件
   * }
   */
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  /**
   *  `onDownloadProgress` 允许为下载处理进度事件，为浏览器专属
   * 
   * @example
   * onDownloadProgress: function (progressEvent) {
   *   // 处理原生进度事件
   * }
   */
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
  /**
   * `maxContentLength` 定义了node.js中允许的HTTP响应内容的最大字节数
   * 
   * @example
   * maxContentLength: 2000,
   */
  maxContentLength?: number;
  /**
   * `maxBodyLength`（仅Node）定义允许的http请求内容的最大字节数
   * 
   * @example
   * maxBodyLength: 2000
   */
  maxBodyLength?: number;
  /**
   *  `validateStatus` 定义了对于给定的 HTTP状态码是 resolve 还是 reject promise。
   *  如果 `validateStatus` 返回 `true` (或者设置为 `null` 或 `undefined`)，则promise 将会 resolved，否则是 rejected。
   * 
   * @example
   *  validateStatus: function (status) {
   *    return status >= 200 && status < 300; // 默认值
   *  }
   */
  validateStatus?: ((status: number) => boolean) | null;
  /**
   * `maxRedirects` 定义了在node.js中要遵循的最大重定向数。如果设置为0，则不会进行重定向
   * 
   * @example
   * maxRedirects: 5, // 默认值
   */
  maxRedirects?: number;
  /**
   *  `socketPath` 定义了在node.js中使用的UNIX套接字。
   * 
   * @example
   * '/var/run/docker.sock' 发送请求到 docker 守护进程。只能指定 `socketPath` 或 `proxy` 。若都指定，这使用 `socketPath` 。
   * socketPath: null, // default
   */
  socketPath?: string | null;
  /**
   * @example
   * httpAgent: new http.Agent({ keepAlive: true }),
   */
  httpAgent?: any;
  /**
   * @example
   * httpsAgent: new https.Agent({ keepAlive: true }),
   */
  httpsAgent?: any;
  /**
   *  `proxy` 定义了代理服务器的主机名，端口和协议。您可以使用常规的`http_proxy` 和 `https_proxy` 环境变量。
   *   使用 `false` 可以禁用代理功能，同时环境变量也会被忽略。
   *   `auth`表示应使用HTTP Basic auth连接到代理，并且提供凭据。
   *   这将设置一个 `Proxy-Authorization` 请求头，它会覆盖 `headers` 中已存在的自定义 `Proxy-Authorization` 请求头。
   *   如果代理服务器使用 HTTPS，则必须设置 protocol 为`https`
   * 
   * @example
   *   proxy: {
   *     protocol: 'https',
   *     host: '127.0.0.1',
   *     port: 9000,
   *     auth: {
   *       username: 'mikeymike',
   *       password: 'rapunz3l'
   *     }
   *   }
   */
  proxy?: AxiosProxyConfig | false;
  /** 
   * @description 用于取消请求
   * @example 
   *  const CancelToken = axios.CancelToken
   *  const source = CancelToken.source()
   *  axios.get<State>('https://api.github.com/users/mzabriskie', {
   *    cancelToken: source.token,
   *  })
   *  两种方式取消请求：
   *  1.source.token.reason = new axios.Cancel('取消请求xxx')
   *  2.source.cancel('取消请求')
   */
  cancelToken?: CancelToken;
  /**
   * 
   * ' decompress '表示是否应该自动解压响应体。如果设置为 `true` 会删除响应头中的`content-encoding`
   * 
   *  -node中才能使用(XHR不能关闭解压缩)
   * @example
   *  decompress: true // 默认值
   */
  decompress?: boolean;
  transitional?: TransitionalOptions;
  /**
   * @description 取消请求的另一种方式
   * @example
   *  const controller = new AbortController()
   *  const { signal } = controller
   *  axios.get<State>('https://api.github.com/users/mzabriskie', {
   *    signal,
   *  })
   *  // 这里abort后会把signal.aboarted设为true，其是个readonly，故需要通过controller.abort()来设置
   * controller.abort()
   */
  signal?: AbortSignal;
  insecureHTTPParser?: boolean;
  transport?: Transport
}

export interface AxiosResponse<T = unknown, D = any>  {
  data: T;
  status: number;
  statusText: string;
  headers: AxiosResponseHeaders;
  config: AxiosRequestConfig<D>;
  request?: any;
}

export interface AxiosError<T = unknown, D = any> extends Error {
  config: AxiosRequestConfig<D>;
  code?: string;
  request?: any;
  response?: AxiosResponse<T, D>;
  isAxiosError: boolean;
  toJSON: () => object;
}

export interface AxiosPromise<T = unknown> extends Promise<AxiosResponse<T>> {
}

export interface CancelStatic {
  new (message?: string): Cancel;
}

export interface Cancel {
  message: string;
  __CANCEL__: boolean
}

export interface Canceler {
  (message?: string): void;
}

export interface CancelTokenStatic {
  new (executor: (cancel: Canceler) => void): CancelToken;
  source(): CancelTokenSource;
}
export type CancelListener = (value:Cancel)=> any
export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
  subscribe(listener: CancelListener): void
  unsubscribe(listener: CancelListener): void
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}
export interface InterceptorConfig<V> {
  /** 是否是同步拦截器，默认都是异步的 */
  synchronous?: boolean;
  /** 用于请求拦截器中判断是否放入requestInterceptorChain，返回false不放入 */
  runWhen?: ((config: V) => boolean) | null ;
}

export type FulfilledFn<T = any> = (val: T)=> T | Promise<T>

export type  RejectedFn =  (error: any) => any;

export interface Interceptor<V> extends InterceptorConfig<V> {
  fulfilled?: FulfilledFn<V>;
  rejected?: RejectedFn;
}
export interface AxiosInterceptorManager<V> {
  use<T = V>(
    onFulfilled?: (value: T) => T | Promise<T>,
    onRejected?: (error: any) => any,
    options?: InterceptorConfig<V>
  ): number;
  eject(id: number): void;
  forEach(fn: (interceptor: Interceptor<V>) => any):void
}

export type AxiosType = Axios

export interface AxiosInstance extends AxiosType {
  (config: AxiosRequestConfig): AxiosPromise;
  (url: string, config?: AxiosRequestConfig): AxiosPromise;
}

export interface AxiosStatic extends AxiosInstance {
  create(config?: AxiosRequestConfig): AxiosInstance;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  Axios: typeof Axios;
  readonly VERSION: string;
  isCancel(value: any): boolean;
  /** 这是axios原先定义的类型 */
  // all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  /** 这是我自己定义的，跟Promise.all类型一致 */
  all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
  isAxiosError(payload: any): payload is AxiosError;
}

declare const axios: AxiosStatic;

export default axios;


export interface Canceler {
  (message?: string): void;
}

export interface CancelExecutor {
  (cancel: Canceler): void;
}
export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}

export interface CancelStatic {
  new (message: string): Cancel;
}