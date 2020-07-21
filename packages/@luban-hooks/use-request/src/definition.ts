import { AxiosResponse, AxiosError } from "axios";

export type BasicParams = object | Array<any> | number | string | boolean | undefined;

export type Fetching = null | boolean;

// service function with params
export type Service<R extends AxiosResponse<any>, P> = (params: P) => Promise<R>;
// service function without params
export type ServiceWithoutParams<R extends AxiosResponse<any>> = () => Promise<R>;

// result with format
interface BasicResult<R extends AxiosResponse<any>, D extends any> {
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
  refresh: () => Promise<void>;
}

// service without params
export interface ResultWithoutParams<R extends AxiosResponse<any>, D extends any>
  extends BasicResult<R, D> {
  // manually invoke service, and params will passed if service has arguments.
  run: () => Promise<void>;
}

// service with params
export interface ResultWithParams<R extends AxiosResponse<any>, P, D extends any, S>
  extends BasicResult<R, D> {
  run: S extends (params: P) => Promise<R>
    ? (params: P) => Promise<void>
    : (params?: P) => Promise<void>;
}

interface BasicOptions<R extends AxiosResponse<any>, D = any> {
  // is manually invoke service
  manual: boolean;

  // default loading status
  defaultLoading: boolean | null;

  // init data
  initialData: unknown;

  // verify response as excepted
  verifyResponse: ((response: R) => boolean) | undefined;

  formatter: ((response: R) => D) | undefined;
}

// service with params and options with formatter
export interface OptionWithParams<R extends AxiosResponse<any>, P, D> extends BasicOptions<R, D> {
  // callback after `verifyResponse` return true
  onSuccess: (data: D, params: P, response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<R["data"]>, params: P) => void;
  // default params
  defaultParams: P;
}

// service without params and options with formatter
export interface OptionWithoutParams<R extends AxiosResponse<any>, D> extends BasicOptions<R, D> {
  // callback after `verifyResponse` return true
  onSuccess: (data: D, response: AxiosResponse<R>) => void;
  // callback during invoke service
  onError: (error: AxiosError<R["data"]>) => void;
}

/**
 * @description Global Options(not include `formatter` param)
 */
export type BasicGlobalOptions<R extends AxiosResponse<any>> = {
  // is manually invoke service; if specified local `manual`, ignored.
  manual?: boolean;

  // global default loading status; if specified local `defaultLoading`, ignored.
  defaultLoading?: boolean | null;

  // global init data; if specified local `initialData`, ignored.
  initialData?: unknown;

  // verify `response` as expected. if specified local `verifyResponse`, it will be ignored.
  verifyResponse?: (response: R) => boolean;

  // callback after `verifyResponse` return true; if specified local `onSuccess`, ignored.
  onSuccess?: (response: AxiosResponse<R>) => void;

  // callback during invoke service; if specified local `onError`, ignored.
  onError?: (error: AxiosError<R["data"]>) => void;
};
