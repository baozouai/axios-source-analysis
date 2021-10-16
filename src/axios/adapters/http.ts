'use strict';

import {isStream, isString,isArrayBuffer, stripBOM} from './../utils';
import settle from './../core/settle';
import buildFullPath from '../core/buildFullPath';
import buildURL from './../helpers/buildURL';
import http from 'http';
import https from 'https';
import {http as httpFollow, https as httpsFollow} from 'follow-redirects';

import url from 'url';
import zlib from 'zlib';
import data from './../env/data';
import createError from '../core/createError';
import enhanceError from '../core/enhanceError';
import defaults from '../defaults';
import Cancel from '../cancel/Cancel';

import { AxiosRequestConfig, AxiosProxyConfig } from '../type'

const VERSION = data.version
var isHttps = /https:?/;

/**
 *
 * @param {http.ClientRequestArgs} options
 * @param {AxiosProxyConfig} proxy
 * @param {string} location
 */
function setProxy(options: any, proxy: AxiosProxyConfig, location: string) {
  options.hostname = proxy.host;
  options.host = proxy.host;
  options.port = proxy.port;
  options.path = location;

  // Basic proxy authorization
  if (proxy.auth) {
    var base64 = Buffer.from(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64');
    options.headers['Proxy-Authorization'] = 'Basic ' + base64;
  }

  // If a proxy is used, any redirects must also pass through the proxy
  options.beforeRedirect = function beforeRedirect(redirection) {
    redirection.headers.host = redirection.host;
    setProxy(redirection, proxy, redirection.href);
  };
}

export default  function httpAdapter(config: AxiosRequestConfig) {
  return new Promise((resolvePromise, rejectPromise) => {
    let onCanceled: any;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }
    const resolve = function resolve(value: any) {
      done();
      resolvePromise(value);
    };
    const reject = function reject(value: any) {
      done();
      rejectPromise(value);
    };
    let data = config.data;
    const headers = config.headers;
    const headerNames: Record<string, string> = {};

    Object.keys(headers as object).forEach(function storeLowerName(name) {
      headerNames[name.toLowerCase()] = name;
    });

    // Set User-Agent (required by some servers)
    // See https://github.com/axios/axios/issues/69
    if ('user-agent' in headerNames) {
      // User-Agent is specified; handle case where no UA header is desired
      if (!headers[headerNames['user-agent']]) {
        delete headers[headerNames['user-agent']];
      }
      // Otherwise, use specified value
    } else {
      // Only set header if it hasn't been set in config
      headers['User-Agent'] = 'axios/' + VERSION;
    }

    if (data && !isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (isString(data)) {
        data = Buffer.from(data, 'utf-8');
      } else {
        return reject(createError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          config
        ));
      }

      // Add Content-Length header if data exists
      if (!headerNames['content-length']) {
        headers['Content-Length'] = data.length;
      }
    }

    // HTTP basic authentication
    let auth;
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password || '';
      auth = username + ':' + password;
    }

    // Parse url
    const fullPath = buildFullPath(config.baseURL, config.url);
    const parsed = url.parse(fullPath);
    const protocol = parsed.protocol || 'http:';

    if (!auth && parsed.auth) {
      const urlAuth = parsed.auth.split(':');
      const urlUsername = urlAuth[0] || '';
      const urlPassword = urlAuth[1] || '';
      auth = urlUsername + ':' + urlPassword;
    }

    if (auth && headerNames.authorization) {
      delete headers[headerNames.authorization];
    }

    const isHttpsRequest = isHttps.test(protocol);
    const agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

    const options: {
      path: string;
      method: string;
      agent: any,
      agents: { http: any; https:  any },
      auth?: string 
      hostname?: string;
      port?: string
    } & Pick<AxiosRequestConfig, 'headers' | 'socketPath' | 'maxRedirects' | 'maxBodyLength' | 'insecureHTTPParser'> = {
      path: buildURL(parsed.path || '', config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config!.method!.toUpperCase(),
      headers,
      agent,
      agents: { http: config.httpAgent, https: config.httpsAgent },
      auth
    };
    if (config.socketPath) {
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname!;
      options.port = parsed.port!;
    }

    let proxy = config.proxy;
    if (!proxy && proxy !== false) {
      const proxyEnv = protocol.slice(0, -1) + '_proxy';
      const proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
      if (proxyUrl) {
        const parsedProxyUrl = url.parse(proxyUrl);
        const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
        let shouldProxy = true;

        if (noProxyEnv) {
          var noProxy = noProxyEnv.split(',').map(function trim(s) {
            return s.trim();
          });

          shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
            if (!proxyElement) {
              return false;
            }
            if (proxyElement === '*') {
              return true;
            }
            if (proxyElement[0] === '.' &&
                parsed.hostname!.substr(parsed.hostname!.length - proxyElement.length) === proxyElement) {
              return true;
            }

            return parsed.hostname === proxyElement;
          });
        }

        if (shouldProxy) {
          proxy = {
            host: parsedProxyUrl.hostname!,
            port: parsedProxyUrl.port as unknown as number,
            protocol: parsedProxyUrl.protocol!
          };

          if (parsedProxyUrl.auth) {
            var proxyUrlAuth = parsedProxyUrl.auth.split(':');
            proxy.auth = {
              username: proxyUrlAuth[0],
              password: proxyUrlAuth[1]
            };
          }
        }
      }
    }

    if (proxy) {
      options.headers!.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '');
      setProxy(options, proxy, protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path);
    }

    let transport: AxiosRequestConfig['transport'];
    const isHttpsProxy = isHttpsRequest && (proxy ? isHttps.test(proxy.protocol!) : true);
    if (config.transport) {
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      transport = isHttpsProxy ? https : http;
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      transport = isHttpsProxy ? httpsFollow : httpFollow;
    }

    if (config.maxBodyLength && config.maxBodyLength > -1) {
      options.maxBodyLength = config.maxBodyLength;
    }

    if (config.insecureHTTPParser) {
      options.insecureHTTPParser = config.insecureHTTPParser;
    }

    // Create the request
    // @ts-ignore
    const req = transport.request(options, function handleResponse(res) {
      if (req.aborted) return;

      // uncompress the response body transparently if required
      let stream = res;

      // return the last request in case of redirects
      const lastRequest = res.req || req;


      // if no content, is HEAD request or decompress disabled we should not decompress
      if (res.statusCode !== 204 && lastRequest.method !== 'HEAD' && config.decompress !== false) {
        switch (res.headers['content-encoding']) {
        /*eslint default-case:0*/
        case 'gzip':
        case 'compress':
        case 'deflate':
        // add the unzipper to the body stream processing pipeline
          stream = stream.pipe(zlib.createUnzip());

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
        }
      }

      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: lastRequest,
        data: undefined
      };

      if (config.responseType === 'stream') {
        // @ts-ignore
        response.data = stream;
        settle(resolve, reject, response);
      } else {
        const responseBuffer:Buffer[] = [];
        let totalResponseBytes = 0;
        stream.on('data', function handleStreamData(chunk: Buffer) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength! > -1 && totalResponseBytes > config.maxContentLength!) {
            stream.destroy();
            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              config, null, lastRequest));
          }
        });

        stream.on('error', function handleStreamError(err: Error) {
          if (req.aborted) return;
          reject(enhanceError(err, config, null, lastRequest));
        });

        stream.on('end', function handleStreamEnd() {
          let responseData: Buffer | string = Buffer.concat(responseBuffer);
          if (config.responseType !== 'arraybuffer') {
            responseData = responseData.toString(config.responseEncoding as BufferEncoding);
            if (!config.responseEncoding || config.responseEncoding === 'utf8') {
              responseData = stripBOM(responseData);
            }
          }
          // @ts-ignore
          response.data = responseData;
          settle(resolve, reject, response);
        });
      }
    });

    // Handle errors
    req.on('error', function handleRequestError(err) {
      if (req.aborted && err.code !== 'ERR_FR_TOO_MANY_REDIRECTS') return;
      reject(enhanceError(err, config, null, req));
    });

    // Handle request timeout
    if (config.timeout) {
      // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
      // @ts-ignore
      var timeout = parseInt(config.timeout, 10);

      if (isNaN(timeout)) {
        reject(createError(
          'error trying to parse `config.timeout` to int',
          config,
          'ERR_PARSE_TIMEOUT',
          req
        ));

        return;
      }

      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
      // And then these socket which be hang up will devoring CPU little by little.
      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
      req.setTimeout(timeout, function handleRequestTimeout() {
        req.abort();
        const transitional = config.transitional || defaults.transitional;
        reject(createError(
          'timeout of ' + timeout + 'ms exceeded',
          config,
          transitional!.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
          req
        ));
      });
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      onCanceled = function(cancel?: { type: string}) {
        if (req.aborted) return;

        req.abort();
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
      };

      config.cancelToken?.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }


    // Send the request
    if (isStream(data)) {
      data.on('error', function handleStreamError(err: Error) {
        reject(enhanceError(err, config, null, req));
      }).pipe(req);
    } else {
      req.end(data);
    }
  });
};
