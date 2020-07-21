/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { AxiosResponse, AxiosError } from "axios";

import { globalOptionsContext } from "./provider";
import {
  getFinalOptions,
  assignParams,
  enhanceError,
  verifyResponseAsAxiosResponse,
  ResponseError,
  isFunction,
} from "./share";

import {
  OptionWithParams,
  OptionWithoutParams,
  BasicParams,
  Fetching,
  Service,
  ServiceWithoutParams,
  ResultWithParams,
  ResultWithoutParams,
} from "./definition";

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

// service without params and options has formatter
function useRequest<
  R extends AxiosResponse<any>,
  D = OptionWithoutParams<R, any>["formatter"] extends (res: R) => infer U ? U : R["data"]
>(
  service: ServiceWithoutParams<R>,
  options?: Partial<OptionWithoutParams<R, D>>,
): ResultWithoutParams<R, D>;

// service with params and options with formatter
function useRequest<
  R extends AxiosResponse<any>,
  P extends BasicParams,
  D = OptionWithoutParams<R, any>["formatter"] extends (res: R) => infer U ? U : R["data"]
>(
  service: Service<R, P>,
  options?: Partial<OptionWithParams<R, P, D>>,
): ResultWithParams<R, P, D, Service<R, P>>;

function useRequest(service: any, options?: any) {
  if (!isFunction(service)) {
    throw Error(`service ${service} is not a function`);
  }

  const isServiceWithParams = useMemo(() => /(?=\()\(\w+\)(?!\))/.test(service.toString()), []);

  const promisifyService = (args?: any) => {
    return new Promise<AxiosResponse<any>>((resolve, reject) => {
      const result = service(args);

      if (isFunction(result.then)) {
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

  const {
    verifyResponse: globalVerifyResponse,
    onSuccess: globalOnSuccess,
    onError: globalOnError,
    manual: globalManual,
    initialData: globalInitialData,
    defaultLoading: globalDefaultLoading,
  } = globalOptions || {};

  const localOptions = getFinalOptions({
    manual: globalManual,
    initialData: globalInitialData,
    defaultLoading: globalDefaultLoading,
    ...options,
  });

  const {
    manual,
    onSuccess,
    onError,
    defaultLoading,
    defaultParams,
    initialData,
    formatter,
    verifyResponse,
  } = localOptions;

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
    if (isFunction(verifyResponse)) {
      return verifyResponse;
    }

    if (isFunction(globalVerifyResponse)) {
      return globalVerifyResponse;
    }

    return () => true;
  }, []);

  const fetch = useCallback(async (params: BasicParams) => {
    dispatch({ fetching: true });

    const assignedParams = assignParams(params, defaultParams);

    dispatch({ params: assignedParams });

    let $response: AxiosResponse<any> = {} as AxiosResponse<any>;

    return new Promise((resolve, reject) => {
      promisifyService(assignedParams)
        .then((response) => {
          $response = response;

          dispatch({ response });

          if (verifyResponseCb(response)) {
            const formattedData = formatter(response);

            dispatch({ data: formattedData });

            if (isFunction(onSuccess)) {
              if (isServiceWithParams) {
                onSuccess(formattedData, assignedParams, response);
              } else {
                onSuccess(formattedData, response);
              }
            } else if (isFunction(globalOnSuccess) && !isFunction(onSuccess)) {
              globalOnSuccess(response);
            }

            resolve();
          } else {
            reject(Error("response is invalid"));
          }
        })
        .catch((error) => {
          const enhancedError = error.isAxiosError
            ? error
            : enhanceError(
                error,
                $response.config,
                $response.statusText,
                $response.request,
                $response,
              );

          dispatch({ error: enhancedError });

          if (error.name === "ResponseError") {
            console.error(enhancedError);
          }

          if (isFunction(onError)) {
            if (isServiceWithParams) {
              onError(enhancedError, assignedParams);
            } else {
              onError(enhancedError);
            }
          } else if (isFunction(globalOnError) && !isFunction(onError)) {
            globalOnError(enhancedError);
          }
        })
        .finally(() => {
          dispatch({ fetching: false });
        });
    });
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
    return Promise.resolve(fetch(params));
  };

  const runWithoutParams = () => {
    return Promise.resolve(fetch(undefined));
  };

  const refresh = () => {
    return Promise.resolve(fetch(stateRef.current.params));
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
