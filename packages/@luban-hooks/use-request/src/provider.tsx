import React, { ReactNode, ReactElement, Context } from "react";
import { BasicGlobalOptions } from "./definition";
import { generateGlobalOptionContext } from "./context";

let globalOptionsContext: Context<BasicGlobalOptions<any>> = {} as Context<BasicGlobalOptions<any>>;

type UseRequestProviderProps<R> = {
  value: BasicGlobalOptions<R>;
  children: ReactNode;
};

function UseRequestProvider<R>(props: UseRequestProviderProps<R>): ReactElement<any, any> {
  const { context: GlobalOptionsContext, initContext } = generateGlobalOptionContext(props.value);

  globalOptionsContext = GlobalOptionsContext;

  return (
    <GlobalOptionsContext.Provider value={initContext}>
      {props.children}
    </GlobalOptionsContext.Provider>
  );
}

export { UseRequestProvider, globalOptionsContext };
