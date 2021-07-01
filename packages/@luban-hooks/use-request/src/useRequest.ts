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
  isObject,
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
  data: unknown;
  error: AxiosError | null;
  params: BasicParams;
  response: AxiosResponse<unknown>;
};

const validResponseMsg = (serviceName?: string) =>
  `service ${serviceName ||
    "unknown"} resolved value is not a valid AxiosResponse, see https://github.com/axios/axios#response-schema`;

// service without params
function useRequest<
  R extends AxiosResponse<unknown>,
  D = OptionWithoutParams<R, R>["formatter"] extends (res: R) => R
    ? R["data"]
    : OptionWithoutParams<R, R>["formatter"] extends (res: R) => infer U
    ? U
    : R["data"]
>(
  service: ServiceWithoutParams<R>,
  options?: Partial<OptionWithoutParams<R, D>>,
): ResultWithoutParams<R, D>;

// service with params
function useRequest<
  R extends AxiosResponse<unknown>,
  P extends BasicParams,
  D = OptionWithParams<R, P, R, Service<R, P>>["formatter"] extends (res: R) => R
    ? R["data"]
    : OptionWithParams<R, P, R, Service<R, P>>["formatter"] extends (res: R) => infer U
    ? U
    : R["data"]
>(
  service: Service<R, P>,
  options?: Partial<OptionWithParams<R, P, D, Service<R, P>>>,
): ResultWithParams<R, P, D, Service<R, P>>;

function useRequest(service: unknown, options?: {}) {
  if (!isFunction(service)) {
    throw Error(`service ${service} is not a function`);
  }

  if (options && !isObject(options)) {
    throw Error("options is not a object");
  }

  const promisifyService = (args?: unknown) => {
    return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
      const result = service(args);

      if (isFunction(result.then)) {
        result
          .then((res: AxiosResponse<unknown>) => {
            if (verifyResponseAsAxiosResponse(res)) {
              resolve(res);
            } else {
              reject(new ResponseError(validResponseMsg(service.name)));
            }
          })
          .catch((e: unknown) => reject(e));
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

  const localOptions = getFinalOptions(
    Object.assign(
      {
        manual: globalManual,
        initialData: globalInitialData,
        defaultLoading: globalDefaultLoading,
      },
      options,
    ),
  );

  const {
    manual,
    onSuccess,
    onError,
    defaultLoading,
    defaultParams,
    initialData,
    formatter,
    verifyResponse,
    update,
    reFetcherDeps,
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
    response: {} as AxiosResponse<unknown>,
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

  const fetch = useCallback(
    (params: BasicParams) => {
      dispatch({ fetching: true });

      const assignedParams = assignParams(params, defaultParams);

      dispatch({ params: assignedParams });

      let $response: AxiosResponse<unknown> = {} as AxiosResponse<unknown>;

      return new Promise((resolve) => {
        promisifyService(assignedParams)
          .then((response) => {
            $response = response;

            dispatch({ response });

            if (verifyResponseCb(response)) {
              const formattedData = formatter(response);

              dispatch({ data: formattedData });

              if (isFunction(onSuccess)) {
                onSuccess(formattedData, response, assignedParams);
              } else if (isFunction(globalOnSuccess) && !isFunction(onSuccess)) {
                globalOnSuccess(response);
              }

              resolve();
            } else {
              throw new Error("Failed validation, response invalid");
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
              onError(enhancedError, assignedParams);
            } else if (isFunction(globalOnError) && !isFunction(onError)) {
              globalOnError(enhancedError);
            }
          })
          .finally(() => {
            dispatch({ fetching: false });
          });
      });
    },
    [...reFetcherDeps],
  );

  const reset = useCallback(() => {
    dispatch({
      fetching: defaultLoading,
      data: initialData,
      params: defaultParams,
      error: null,
    });
  }, []);

  const run = (params?: BasicParams) => {
    return Promise.resolve(fetch(params));
  };

  const refresh = () => {
    return Promise.resolve(fetch(stateRef.current.params));
  };

  const setData = (setter: (data: unknown) => unknown) => {
    const nextData = setter(stateRef.current.data);
    if (nextData) {
      dispatch({ data: nextData });
    }
  };

  useEffect(() => {
    if (!manual) {
      fetch(defaultParams);
    }
  }, []);

  useEffect(() => {
    if (manual && update) {
      dispatch({ data: initialData });
    }
  }, [manual, update]);

  return useMemo(() => {
    const state = {
      setData,
      reset,
      refresh,
      run: run,
    };
    Object.defineProperties(state, {
      loading: {
        get: () => {
          stateDependenciesRef.current.fetching = true;
          return stateRef.current.fetching;
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
