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
  silentJSONParsing: boolean;
  forcedJSONParsing: boolean;
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
  url?: string;
  method?: Method;
  baseURL?: string;
  transformRequest?: AxiosRequestTransformer | AxiosRequestTransformer[];
  transformResponse?: AxiosResponseTransformer | AxiosResponseTransformer[];
  headers?: AxiosRequestHeaders;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: D;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  adapter?: AxiosAdapter;
  auth?: AxiosBasicCredentials;
  responseType?: ResponseType;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: ((status: number) => boolean) | null;
  maxBodyLength?: number;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | false;
  cancelToken?: CancelToken;
  decompress?: boolean;
  transitional?: TransitionalOptions;
  signal?: AbortSignal;
  responseEncoding?: responseEncoding | string & {};
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
  synchronous?: boolean;
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