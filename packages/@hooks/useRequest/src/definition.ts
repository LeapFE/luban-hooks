import { AxiosResponse, AxiosError } from "axios";

export type BasicParams = object | Array<any> | number | string | boolean | undefined;

export type Fetching = null | boolean;

// service function with params
export type Service<R extends AxiosResponse<any>, P> = (params: P) => Promise<R>;
// service function without params
export type ServiceWithoutParams<R extends AxiosResponse<any>> = () => Promise<R>;

// result without format
interface BasicResult<R extends AxiosResponse<any>> {
  // is executing service(Promise that service returned whether or not resolved/rejected)
  loading: boolean;

  // data of service returned, default {}.
  // if give formatter, it will override by formatter returned value
  data: R["data"];

  // axios response schema. see https://github.com/axios/axios#response-schema
  response: R;

  // exception that while invoke service
  error: AxiosError<R["data"]> | null;

  // reset all status, set loading(false), set error(null), set data({})
  reset: () => void;

  // invoke service, use last params if service has arguments.
  refresh: () => void;
}

interface BasicResultWithFormat<R extends AxiosResponse<any>, D extends any> {
  // is executing service(Promise that service returned whether or not resolved/rejected)
  loading: boolean;

  // data of service returned, default {}
  // if give formatter, it will override by formatter returned value
  data: D;

  // axios response schema. see https://github.com/axios/axios#response-schema
  response: R;

  // exception that while invoke service
  error: AxiosError<D> | null;

  // reset all status, set loading(false), set error(null), set data({})
  reset: () => void;

  // invoke service, use last params if service has arguments.
  refresh: () => void;
}

// service without params and options without formatter
export interface ResultWithoutParamsWithoutFormat<R extends AxiosResponse<any>>
  extends BasicResult<R> {
  // manually invoke service, and params will passed if service has arguments.
  run: () => void;
}

// service without params and options with formatter
export interface ResultWithoutParamsWithFormat<R extends AxiosResponse<any>, D extends any>
  extends BasicResultWithFormat<R, D> {
  // manually invoke service, and params will passed if service has arguments.
  run: () => void;
}

// service with params and options without formatter
export interface ResultWithParamsWithoutFormat<R extends AxiosResponse<any>, P, S>
  extends BasicResult<R> {
  run: S extends (params: P) => Promise<R> ? (params: P) => void : (params?: P) => void;
}

// service with params and options with formatter
export interface ResultWithParamsWithFormat<R extends AxiosResponse<any>, D extends any, P, S>
  extends BasicResultWithFormat<R, D> {
  run: S extends (params: P) => Promise<R> ? (params: P) => void : (params?: P) => void;
}

interface BasicOptions<R extends AxiosResponse<any>> {
  // is manually invoke service
  manual: boolean;

  // default loading status
  defaultLoading: boolean | null;

  // init data
  initialData: unknown;

  // verify response as excepted
  checkResponse: ((response: R) => boolean) | undefined;
}

// service without params and options without formatter
export interface OptionWithoutParamsWithoutFormat<R extends AxiosResponse<any>>
  extends BasicOptions<R> {
  // callback after `checkResponse` return true
  onSuccess: (data: R["data"], response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<R["data"]>) => void;
}

// service with params and options without formatter
export interface OptionWithParamsWithoutFormat<R extends AxiosResponse<any>, P>
  extends BasicOptions<R> {
  // callback after `checkResponse` return true
  onSuccess: (data: R["data"], params: P, response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<R["data"]>, params: P) => void;
  // default params
  defaultParams: P;
}

// service with params and options with formatter
export interface OptionWithParamsWithFormat<R extends AxiosResponse<any>, D, P>
  extends BasicOptions<R> {
  // callback after `checkResponse` return true
  onSuccess: (data: D, params: P, response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<D>, params: P) => void;
  // default params
  defaultParams: P;
}

// service without params and options with formatter
export interface OptionWithoutParamsAndWithFormat<R extends AxiosResponse<any>, D>
  extends BasicOptions<R> {
  // callback after `checkResponse` return true
  onSuccess: (data: D, response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<D>) => void;
}

export interface AdvancedOptionsWithParams<R extends AxiosResponse<any>, P, E, T extends E>
  extends Partial<OptionWithParamsWithFormat<R, T, P>> {
  formatter: (response: R) => E;
}

export interface AdvancedOptionsWithoutParams<R extends AxiosResponse<any>, E, T extends E>
  extends Partial<OptionWithoutParamsAndWithFormat<R, T>> {
  formatter: (response: R) => E;
}

// Global Options
export type BasicGlobalOptions<R> = {
  // verify `response` as expected. if specify it in `useRequest`, it will be override.
  checkResponse?: (response: R) => boolean;
};
