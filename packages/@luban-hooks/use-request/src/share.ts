import { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";
import {
  BasicParams,
  OptionWithParamsWithoutFormat,
  AdvancedOptionsWithParams,
} from "./definition";

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function isArray(value: unknown): value is Array<any> {
  return Object.prototype.toString.call(value) === "[object Array]";
}

export function isFunction(value: unknown): value is Function {
  return Object.prototype.toString.call(value) === "[object Function]";
}

export function assignParams(params: unknown, defaultParams: unknown): BasicParams {
  let assignedParams = undefined;

  try {
    if (isObject(params) && isObject(defaultParams)) {
      assignedParams = Object.assign(defaultParams, params);
    } else if (isArray(params) && isArray(defaultParams)) {
      assignedParams = [...defaultParams, ...params];
    } else if (isObject(params)) {
      assignedParams = params;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {}

  return assignedParams;
}

export function getFinalOptions(
  defaultOptions: OptionWithParamsWithoutFormat<AxiosResponse<{}>, undefined>,
  options?: unknown,
): Record<keyof AdvancedOptionsWithParams<AxiosResponse<{}>, any, any, any>, any> {
  if (isObject(options)) {
    return {
      manual: options.manual || defaultOptions.manual,
      onSuccess: options.onSuccess || defaultOptions.onSuccess,
      onError: options.onError || defaultOptions.onError,
      defaultLoading: options.defaultLoading || defaultOptions.defaultLoading,
      defaultParams: options.defaultParams || defaultOptions.defaultParams,
      initialData: options.initialData || defaultOptions.initialData,
      verifyResponse: options.verifyResponse || defaultOptions.verifyResponse,
      formatter: options.formatter || ((res: any) => res.data),
    };
  }

  return { ...defaultOptions, formatter: (res: any) => res.data };
}

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
export function enhanceError(
  error: Error,
  config: AxiosRequestConfig,
  code: string,
  request: any,
  response: AxiosResponse<any>,
): AxiosError<any> {
  const err = Object.create({});

  Object.defineProperties(err, {
    message: {
      value: error.message,
    },
    name: {
      value: error.name,
    },
    stack: {
      value: error.stack,
    },
    config: {
      value: config,
    },
    code: {
      value: code,
    },
    request: {
      value: request,
    },
    response: {
      value: response,
    },
    isAxiosError: {
      value: true,
    },
    toJSON: {
      value: () => {
        return {
          // Standard
          message: error.message,
          name: error.name,
          // Microsoft
          // @ts-ignore
          description: error.description,
          // @ts-ignore
          number: error.number,
          // Mozilla
          // @ts-ignore
          fileName: error.fileName,
          // @ts-ignore
          lineNumber: error.lineNumber,
          // @ts-ignore
          columnNumber: error.columnNumber,
          stack: error.stack,
          // Axios
          // @ts-ignore
          config: error.config,
          // @ts-ignore
          code: error.code,
        };
      },
    },
  });

  return err as AxiosError<any>;
}

export function verifyResponseAsAxiosResponse(res: unknown): boolean {
  if (!isObject(res)) {
    return false;
  }

  if (!(res.request instanceof XMLHttpRequest)) {
    return false;
  }

  if (!isObject(res.headers)) {
    return false;
  }

  if (!isObject(res.config)) {
    return false;
  }

  if (res.data === undefined || typeof res.status !== "number" || res.statusText === undefined) {
    return false;
  }

  return true;
}

export class ResponseError extends Error {
  constructor(message?: string) {
    super();

    this.name = "ResponseError";
    this.message = message || "response error";
    this.stack = new Error().stack;
  }
}
