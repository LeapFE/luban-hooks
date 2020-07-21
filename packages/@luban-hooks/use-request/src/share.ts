import { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";
import { BasicParams, OptionWithParams } from "./definition";

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function isArray(value: unknown): value is Array<any> {
  return Object.prototype.toString.call(value) === "[object Array]";
}

export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
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
  options?: unknown,
): Record<keyof OptionWithParams<AxiosResponse<{}>, any, any>, any> {
  const defaultOptions = {
    manual: false,
    defaultLoading: null,
    defaultParams: undefined,
    initialData: {},
    formatter: (res: any) => res.data,
  };
  if (isObject(options)) {
    return {
      manual: options.manual || defaultOptions.manual,
      onSuccess: options.onSuccess,
      onError: options.onError,
      defaultLoading: options.defaultLoading || defaultOptions.defaultLoading,
      defaultParams: options.defaultParams || defaultOptions.initialData,
      initialData: options.initialData || {},
      verifyResponse: options.verifyResponse,
      formatter: options.formatter || defaultOptions.formatter,
    };
  }

  return {
    ...defaultOptions,
    onError: undefined,
    onSuccess: undefined,
    verifyResponse: undefined,
  };
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
