import { AxiosResponse } from "axios";
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
      checkResponse: options.checkResponse || defaultOptions.checkResponse,
      formatter: options.formatter || ((res: any) => res.data),
    };
  }

  return { ...defaultOptions, formatter: (res: any) => res };
}
