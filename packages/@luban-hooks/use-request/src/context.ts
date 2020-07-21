import { createContext, Context } from "react";
import { AxiosResponse } from "axios";

import { BasicGlobalOptions } from "./definition";
import { isObject } from "./share";

function generateGlobalOptionContext<R extends AxiosResponse<any>>(
  value: BasicGlobalOptions<R>,
): {
  context: Context<BasicGlobalOptions<R>>;
  initContext: BasicGlobalOptions<R>;
} {
  let initContext = Object.create({});

  if (isObject(value)) {
    initContext = value;
  }

  const context = createContext(initContext);
  context.displayName = "__use_request_global_options__";

  return { context, initContext };
}

export { generateGlobalOptionContext };
