import { createContext, Context } from "react";
import { BasicGlobalOptions } from "./definition";

function generateGlobalOptionContext<R>(
  value: BasicGlobalOptions<R>,
): {
  context: Context<BasicGlobalOptions<R>>;
  initContext: BasicGlobalOptions<R>;
} {
  const initContext = Object.create({});

  // const initContext = Object.create({ ...value });

  if (value) {
    if (typeof value.verifyResponse === "function") {
      initContext.verifyResponse = value.verifyResponse;
    }
  }

  const context = createContext(initContext);
  context.displayName = "__use_request_global_options__";

  return { context, initContext };
}

export { generateGlobalOptionContext };
