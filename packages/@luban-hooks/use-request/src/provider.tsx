import React, { ReactNode, ReactElement, Context } from "react";
import { AxiosResponse } from "axios";

import { BasicGlobalOptions } from "./definition";
import { generateGlobalOptionContext } from "./context";

let globalOptionsContext: Context<BasicGlobalOptions<any>> = {} as Context<BasicGlobalOptions<any>>;

type UseRequestProviderProps<R extends AxiosResponse<any>> = {
  value: BasicGlobalOptions<R>;
  children: ReactNode;
};

function UseRequestProvider<R extends AxiosResponse<any>>(
  props: UseRequestProviderProps<R>,
): ReactElement<any, any> {
  const { context: GlobalOptionsContext, initContext } = generateGlobalOptionContext(props.value);

  globalOptionsContext = GlobalOptionsContext;

  return (
    <GlobalOptionsContext.Provider value={initContext}>
      {props.children}
    </GlobalOptionsContext.Provider>
  );
}

export { UseRequestProvider, globalOptionsContext };
