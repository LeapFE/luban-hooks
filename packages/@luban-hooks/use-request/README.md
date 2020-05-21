# `@hooks/use-request`

> 一个基于 [axios](https://github.com/axios/axios) 的管理异步请求的 [Hooks](https://reactjs.org/docs/hooks-intro.html).

## 安装
``` shell
npm i @luban-hooks/use-request

# 未安装 axios
npm i axios@0.19.2
```

## 使用

### 默认请求

`useRequest` 接收的第一个参数是一个返回了 Promise 的异步函数（以下简称 service 函数），并且该 Promise resolved 的值必须是符合 [Axios Response Schema](https://github.com/axios/axios#response-schema) 的。在组件首次加载是便会触发该函数执行，同时返回 `data`, `error`, `loading` 等状态。

```typescript
import React, { FunctionComponent } from "react";
import axios from "axios";
import { useRequest } from "@luban-hooks/use-request";

type Response<T> = {
  success: boolean;
  data: T;
};

type Topic = {
  id: string;
  title: string;
};

function getTopicList() {
  return axios.get<Response<Topic[]>>("https://cnodejs.org/api/v1/topics?limit=10");
}

const User: FunctionComponent = () => {
  const { data, loading, error } = useRequest(getTopicList);

  if (error) {
    return <div>something wrong</div>;
  }

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <ul>
      {Array.isArray(data.data) && data.data.map((topic) => {
        return <li key={topic.id}>{topic.title}</li>;
      })}
    </ul>
  );
};
```

### 手动触发

向 `useRequest` 传递第二个参数并且设置 `manual` 为 `true`，此时并不会在组件首次加载时触发 service 函数，而是需要手动的执行 `run` 函数。

```typescript
import React, { FunctionComponent } from "react";
import axios from "axios";
import { useRequest } from "@luban-hooks/use-request";

type Response<T> = {
  success: boolean;
  data: T;
};

type Topic = {
  id: string;
  title: string;
};

function getTopicList() {
  return axios.get<Response<Topic[]>>("https://cnodejs.org/api/v1/topics?limit=10");
}

const User: FunctionComponent = () => {
  const { data, loading, error, run } = useRequest(getTopicList, {
    manual: true,
  });

  if (error) {
    return <div>something wrong</div>;
  }

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <>
      <ul>
        {Array.isArray(data.data) && data.data.map((topic) => {
          return <li key={topic.id}>{topic.title}</li>;
        })}
      </ul>
      <button type="button" onClick={() => run()}>send</button>
    </>
  );
};
```

## API
```typescript
const {
  response,
  data,
  error,
  loading,
  run,
  refresh,
  reset,
} = useRequest(service, {
  manual,
  defaultLoading,
  initialData,
  defaultParams,
  onSuccess,
  onError,
  verifyResponse,
  formatter,
});
```

### 返回

#### response

*@description:* service 函数返回的数据，其格式是符合 [Axios Response Schema](https://github.com/axios/axios#response-schema) 的。

*@type*: `AxiosResponse<any> `

#### data

*@description:* service 函数返回的 `response.data`；如果设置了 `options.formatter`， 该值会被 `formatter` 返回的值覆盖。

*@type:* `AxiosResponse["data"] | any`

#### error

*@description:* service 执行过程中抛出的异常。

*@type:*`AxiosError<R["data"]> | null`

#### loading

*@description:*service 是否正在执行。

*@type:*`boolean`

#### run

*@description:*手动触发 service 函数执行，参数将会传递给 service 函数。

*@type:*`(params: any) => Promise<void>`

#### reset

*@description:重置状态，包括 `loading`, `error`, `data`。*

*@type:*`() => void`

#### refresh

*@description:*重新执行 service 函数，并使用上一次使用的参数。

*@type:*`() => Promise<void>`



### 参数

#### service

一个返回了 Promise 的异步函数，并且该 Promise resolved 的值必须是符合 [Axios Response Schema](https://github.com/axios/axios#response-schema) 的。否则 `data` 可能会不符合预期。

#### options

以下参数都是可选的。

##### manual

*@description:*是否需要手动触发 service 函数

*@type:*`boolean`

*@default:*`false`

##### defaultLoading

*@description:默认 loading 状态*

*@type*:`boolean`

*@default:*`false`

##### initialData

*@description:*初始的 data

*@type:*`any`

*@default:*`{}`

##### defaultParams

*@description:*默认传递给 service 的参数

*@type:*`any`

*@default:*`undefined`

##### onSuccess

*@description:*service 执行成功的回调

*@type:*`(data: AxiosResponse["data"], response: AxiosResponse<any>) => void | (data: AxiosResponse["data"], params: any, response: AxiosResponse<any>) => void;`

*@default:`() => undefined`*

##### onError

*@description:*service 执行失败的回调

*@type:*`(error: AxiosError<AxiosResponse["data"]>) => void | (error: AxiosError<AxiosResponse["data"]>, params: any) => void;`

*@default:`() => undefined`*

##### verifyResponse

*@description:*校验 service 函数返回的数据是否符合预期

*@type:*`((response: AxiosResponse<any>) => boolean) `

*@default:*`() => true`

##### formatter

*@description:*对 service 函数返回的数据进行转换

*@type:*`(response: AxiosResponse<any>) => any`

*@default:*`(res) => res.data `

> 当使用此配置进行数据转换时，需要显式的指定形参 `res` 的类型，以确保可以正确的推导出 `data` 的类型， 例如：
>
> ```ts
> const { data, loading, error, run } = useRequest(getTopicList, {
>   formatter: (res: AxiosResponse<Response<Topic[]>>) => res.data.data,
> });
> ```

### 全局配置

可以通过 `UseRequestProvider` 在根组件设置一些全局配置。

``` tsx
import { UseRequestProvider } from "@luban-hooks/use-request";

type Response<T> = {
  success: boolean;
  data: T;
};

<UseRequestProvider<AxiosResponse<Response<any>> value={{
  verifyResponse: (res) => res.status === 200 && res.data.success,
}}>
  <App />
</UseRequestProvider>
```

`UseRequestProvider` 目前只接受一个参数，即 `verifyResponse`, 具体使用和 `useRequest` 的 `options.verifyResponse` 相同。

