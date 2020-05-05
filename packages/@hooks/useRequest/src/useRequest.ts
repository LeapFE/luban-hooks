/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { AxiosResponse, AxiosError } from "axios";

import {
  Fetching,
  BasicParams,
  Service,
  ServiceWithoutParams,
  ResultWithParamsWithFormat,
  ResultWithParamsWithoutFormat,
  ResultWithoutParamsWithFormat,
  ResultWithoutParamsWithoutFormat,
  OptionWithParamsWithoutFormat,
  OptionWithoutParamsWithoutFormat,
  AdvancedOptionsWithParams,
  AdvancedOptionsWithoutParams,
} from "./definition";

import { globalOptionsContext } from "./provider";
import { getFinalOptions, assignParams } from "./share";

const defaultOptions: OptionWithParamsWithoutFormat<AxiosResponse<{}>, undefined> = {
  manual: false,
  onSuccess: () => undefined,
  onError: () => undefined,
  defaultLoading: null,
  defaultParams: undefined,
  initialData: {},
  checkResponse: undefined,
};

// service without params and options without formatter
function useRequest<R extends AxiosResponse<any>>(
  service: ServiceWithoutParams<R>,
  options?: Partial<OptionWithoutParamsWithoutFormat<R>>,
): ResultWithoutParamsWithoutFormat<R>;

// service with params and options without formatter
function useRequest<R extends AxiosResponse<any>, P extends BasicParams>(
  service: Service<R, P>,
  options?: Partial<OptionWithParamsWithoutFormat<R, P>>,
): ResultWithParamsWithoutFormat<R, P, Service<R, P>>;

// service without params and options has formatter
function useRequest<R extends AxiosResponse<any>, D, T extends D>(
  service: ServiceWithoutParams<R>,
  options?: AdvancedOptionsWithoutParams<R, D, T>,
): ResultWithoutParamsWithFormat<R, D>;

// service with params and options with formatter
function useRequest<R extends AxiosResponse<any>, P extends BasicParams, D, T extends D>(
  service: Service<R, P>,
  options?: AdvancedOptionsWithParams<R, P, D, T>,
): ResultWithParamsWithFormat<R, D, P, Service<R, P>>;

function useRequest(service: any, options?: any) {
  // check service return promise and instance function
  if (typeof service !== "function") {
    throw Error(`service ${service} is not a function`);
  }

  const isServiceWithParams = useMemo(() => /(?=\()\(\w+\)(?!\))/.test(service.toString()), []);
  // console.log("%cIsServiceWithParams", "font-size: 18px", isServiceWithParams);

  const promisifyService = (args?: any) => {
    return new Promise<AxiosResponse<any>>((resolve, reject) => {
      const result = service(args);

      if (typeof result.then === "function") {
        result.then((res: any) => resolve(res)).catch((e: any) => reject(e));
      } else {
        resolve(result);
        console.error(`service function "${service.name}" return value not a Promise`);
      }
    });
  };

  // TODO check options

  const globalOptions = useContext(globalOptionsContext);
  // console.log("%cGlobalOptions", "color: blue; font-size: 16px", globalOptions);

  const { checkResponse: globalCheckResponse } = globalOptions;

  const _options = getFinalOptions(defaultOptions, options);
  // console.log("%c_options", "color: orange", _options);

  const {
    manual,
    onSuccess,
    onError,
    defaultLoading,
    defaultParams,
    initialData,
    formatter,
    checkResponse,
  } = _options;

  const [fetching, setFetching] = useState<Fetching>(defaultLoading);
  const [data, setData] = useState(initialData);
  const [response, setResponse] = useState({} as AxiosResponse<any>);
  const [params, setParams] = useState<BasicParams>(defaultParams);
  const [error, setError] = useState<AxiosError | null>(null);

  const checkResponseCb = useMemo(() => {
    if (typeof checkResponse === "function") {
      return checkResponse;
    }

    if (typeof globalCheckResponse === "function") {
      return globalCheckResponse;
    }

    return () => true;
  }, []);

  const formatterCb = useMemo(() => {
    if (typeof formatter === "function") {
      return formatter;
    }

    return (res: AxiosResponse<any>) => res.data;
  }, []);

  const fetch = useCallback(async (params: BasicParams) => {
    setParams(undefined);
    setError(null);
    setData(initialData);
    setResponse({} as AxiosResponse<any>);

    setFetching(true);

    const assignedParams = assignParams(params, defaultParams);

    setParams(assignedParams);

    let response: AxiosResponse<any> = {} as AxiosResponse<any>;

    try {
      response = await promisifyService(assignedParams);

      setResponse(response);

      if (checkResponseCb(response)) {
        const formattedData = formatterCb(response);

        setData(formattedData);

        if (isServiceWithParams) {
          onSuccess(formattedData, assignedParams, response);
        } else {
          onSuccess(formattedData, response);
        }
      } else {
        throw Error("response is invalid");
      }
    } catch (error) {
      setError(error);

      if (isServiceWithParams) {
        onError(error, assignedParams);
      } else {
        onError(error);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setParams(defaultParams);
    setFetching(defaultLoading);
    setError(null);
  }, []);

  const runWithParams = (params?: BasicParams) => {
    fetch(params);
  };

  const runWithoutParams = () => {
    fetch(undefined);
  };

  const refresh = () => {
    fetch(params);
  };

  useEffect(() => {
    if (!manual) {
      fetch(defaultParams);
    }
  }, []);

  return {
    loading: fetching || false,
    data,
    response,
    error,
    reset,
    refresh,
    run: isServiceWithParams ? runWithParams : runWithoutParams,
  };
}

export { useRequest };
