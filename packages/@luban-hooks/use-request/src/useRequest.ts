/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
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
import {
  getFinalOptions,
  assignParams,
  enhanceError,
  verifyResponseAsAxiosResponse,
  ResponseError,
} from "./share";

type StateRef = {
  fetching: Fetching;
  data: any;
  error: AxiosError | null;
  params: BasicParams;
  response: AxiosResponse<any>;
};

const validResponseMsg = (serviceName?: string) =>
  `service ${serviceName ||
    "unknown"} resolved value is not a valid AxiosResponse, see https://github.com/axios/axios#response-schema`;

const defaultOptions: OptionWithParamsWithoutFormat<AxiosResponse<{}>, undefined> = {
  manual: false,
  onSuccess: () => undefined,
  onError: () => undefined,
  defaultLoading: null,
  defaultParams: undefined,
  initialData: {},
  verifyResponse: undefined,
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
  if (typeof service !== "function") {
    throw Error(`service ${service} is not a function`);
  }

  const isServiceWithParams = useMemo(() => /(?=\()\(\w+\)(?!\))/.test(service.toString()), []);

  const promisifyService = (args?: any) => {
    return new Promise<AxiosResponse<any>>((resolve, reject) => {
      const result = service(args);

      if (typeof result.then === "function") {
        result
          .then((res: any) => {
            if (verifyResponseAsAxiosResponse(res)) {
              resolve(res);
            } else {
              reject(new ResponseError(validResponseMsg(service.name)));
            }
          })
          .catch((e: any) => reject(e));
      } else {
        resolve(result);
        console.error(`service function "${service.name}" return value not a Promise`);
      }
    });
  };

  const globalOptions = useContext(globalOptionsContext);

  const { verifyResponse: globalVerifyResponse } = globalOptions;

  const _options = getFinalOptions(defaultOptions, options);

  const {
    manual,
    onSuccess,
    onError,
    defaultLoading,
    defaultParams,
    initialData,
    formatter,
    verifyResponse,
  } = _options;

  const stateDependenciesRef = useRef({
    fetching: false,
    data: false,
    response: false,
    error: false,
    params: false,
  });
  const stateRef = useRef<StateRef>({
    fetching: defaultLoading,
    data: initialData,
    response: {} as AxiosResponse<any>,
    error: null,
    params: defaultParams,
  });

  const render = useState<null | {}>(null)[1];

  const dispatch = useCallback((payload: Partial<StateRef>) => {
    let shouldUpdateState = false;
    for (const k in payload) {
      stateRef.current[k] = payload[k];
      if (stateDependenciesRef.current[k]) {
        shouldUpdateState = true;
      }
    }
    if (shouldUpdateState) {
      render({});
    }
  }, []);

  const verifyResponseCb = useMemo(() => {
    if (typeof verifyResponse === "function") {
      return verifyResponse;
    }

    if (typeof globalVerifyResponse === "function") {
      return globalVerifyResponse;
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
    dispatch({ fetching: true });

    const assignedParams = assignParams(params, defaultParams);

    dispatch({ params: assignedParams });

    let response: AxiosResponse<any> = {} as AxiosResponse<any>;

    try {
      response = await promisifyService(assignedParams);

      dispatch({ response });

      if (verifyResponseCb(response)) {
        const formattedData = formatterCb(response);

        dispatch({ data: formattedData });

        if (isServiceWithParams) {
          onSuccess(formattedData, assignedParams, response);
        } else {
          onSuccess(formattedData, response);
        }
      } else {
        throw Error("response is invalid");
      }
    } catch (error) {
      const enhancedError = error.isAxiosError
        ? error
        : enhanceError(error, response.config, response.statusText, response.request, response);
      dispatch({ error: enhancedError });

      if (error.name === "ResponseError") {
        console.error(enhancedError);
      }

      if (isServiceWithParams) {
        onError(enhancedError, assignedParams);
      } else {
        onError(enhancedError);
      }
    } finally {
      dispatch({ fetching: false });
    }
  }, []);

  const reset = useCallback(() => {
    dispatch({
      fetching: defaultLoading,
      data: initialData,
      params: defaultParams,
      error: null,
    });
  }, []);

  const runWithParams = (params?: BasicParams) => {
    fetch(params);
  };

  const runWithoutParams = () => {
    fetch(undefined);
  };

  const refresh = () => {
    fetch(stateRef.current.params);
  };

  useEffect(() => {
    if (!manual) {
      fetch(defaultParams);
    }
  }, []);

  return useMemo(() => {
    const state = {
      reset,
      refresh,
      run: isServiceWithParams ? runWithParams : runWithoutParams,
    };
    Object.defineProperties(state, {
      loading: {
        get: () => {
          stateDependenciesRef.current.fetching = true;
          return stateRef.current.fetching || false;
        },
      },
      data: {
        get: () => {
          stateDependenciesRef.current.data = true;
          return stateRef.current.data;
        },
      },
      response: {
        get: () => {
          stateDependenciesRef.current.response = true;
          return stateRef.current.response;
        },
      },
      error: {
        get: () => {
          stateDependenciesRef.current.error = true;
          return stateRef.current.error;
        },
      },
    });

    return state;
  }, [refresh]);
}

export { useRequest };
