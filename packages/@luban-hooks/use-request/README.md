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

interface ResponseData<T> {
  code: number;
  msg?: string;
  data: T;
}

interface UserItem {
  id: number;
  name: string;
}

function getUserList(params: getUserListQuery) {
  const url = params.name ? `/users?name=${params.name}` : "/users";
  return request.get<ResponseData<UserItem[]>>(url);
}

const User: FunctionComponent = () => {
  const { data: userList, loading, error } = useRequest(getUserList, {
    initialData: [],
    defaultParams: {},
    formatter: (res) => res.data.data,
  });

  if (error) {
    return <div>something wrong</div>;
  }

  if (loading) {
    return <div>loading...</div>;
  }

  return (
    <ul>
      {userList.map((user) => {
        return <li key={user.id}>{user.name}</li>;
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

interface ResponseData<T> {
  code: number;
  msg?: string;
  data: T;
}

function addUser(params: { name: string }) {
  return request.post<ResponseData<boolean>>(`/user/${params.name}`);
}

const User: FunctionComponent = () => {
   const { run: putAddUser } = useRequest(addUser, {
    manual: true,
    onSuccess: (data) => {
      if (data.code === 1) {
        // TODO do something
      }
    },
  });

  return (
    <ul>
      {/* TODO display user list */}
      <button type="button" onClick={() => putAddUser({ name: "brendan" })}>Add</button>
    </ul>
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
  update,
  reFetcherDeps,
});
```

### 返回

#### response

*@description:* service 函数返回的数据，其数据结构符合 [Axios Response Schema](https://github.com/axios/axios#response-schema) 的。

*@type*: `AxiosResponse<any> `

#### data

*@description:* service 函数返回的 `response.data`；如果设置了 `options.formatter`， 该值会被 `formatter` 返回的值覆盖。

*@type:* `AxiosResponse["data"] | any`

#### error

*@description:* service 执行过程中抛出的异常。

*@type:*`AxiosError<R["data"]> | null`

#### loading

*@description:* service 是否正在执行。

*@type:*`boolean`

#### run

*@description:* 手动触发 service 函数执行，参数将会传递给 service 函数。

*@type:*`(params: any) => Promise<void>`

#### reset

*@description:* 重置状态，包括 `loading`, `error`, `data`。

*@type:*`() => void`

#### refresh

*@description:* 重新执行 service 函数，并使用上一次使用的参数。

*@type:*`() => Promise<void>`

#### setData

*@description:* 接受一个函数，允许读取或直接修改 `data`。

*@type:*`(setter: (data: D) => D | void) => void;`



### 参数

#### service

一个返回了 Promise 的异步函数，并且该 Promise resolved 的值必须是符合 [Axios Response Schema](https://github.com/axios/axios#response-schema) 的。否则 `data` 可能会不符合预期。

#### options

以下参数都是可选的。

##### manual

*@description:* 是否需要手动触发 service 函数

*@type:*`boolean`

*@default:*`false`

##### update

*@description:* 为 true 时，将会以 `initialData` 更新 `data`

*@type:*`boolean`

*@default:*`false`

##### reFetcherDeps

*@description:* 设置调用 `run` `refresh` 方法时的依赖，当依赖变化时，`run` `refresh` 方法将不再返回一个记忆回调函数。[这是一个详细的例子](#获取最新的状态)

*@type:*`unknown[]`

*@default:*`[]`

##### defaultLoading

*@description:* 默认 loading 状态

*@type*:`boolean`

*@default:*`false`

##### initialData

*@description:* 初始的 data

*@type:*`any`

*@default:*`{}`

##### defaultParams

*@description:* 默认传递给 service 的参数

*@type:*`any`

*@default:*`undefined`

##### onSuccess

*@description:* service 执行成功的回调

*@type:*`(data: AxiosResponse["data"], response: AxiosResponse<any>) => void | (data: AxiosResponse["data"], response: AxiosResponse<any>, params: any) => void;`

*@default:*`() => undefined`

##### onError

*@description:* service 执行失败的回调

*@type:*`(error: AxiosError<AxiosResponse["data"]>) => void | (error: AxiosError<AxiosResponse["data"]>, params: any) => void;`

*@default:*`() => undefined`

##### verifyResponse

*@description:* 校验 service 函数返回的数据是否符合预期

*@type:*`((response: AxiosResponse<any>) => boolean) `

*@default:*`() => true`

##### formatter

*@description:* 对 service 函数返回的数据进行转换

*@type:*`(response: AxiosResponse<any>) => any`

*@default:*`(res) => res.data `

##### 同时存在 `formatter` 和 `onSuccess` 参数：

当 `formatter` 和 `onSuccess` 参数同时存在时，使用 `onSuccess` 的第一个参数时，需要显式的标明其类型；`formatter` 参数不存在时，则 `onSuccess` 的第一个参数不需要显示的标明类型：

```tsx
 const { data: userList, run: fetchUserList } = useRequest(getUserList, {
   initialData: [],
   defaultParams: {},
   formatter: (res) => res.data.data,
   // 需要使用 `formatter` 返回的值类型来标明 `onSuccess` 第一个参数的类型，确保 `userList` 的类型被正确的推导
   // 当 `formatter` 参数不传，`onSuccess` 的第一个参数则不需要显示的标明类型！！！ 
   onSuccess: (data: UserItem[], res, params) => {
     console.log(data, res, params);
   },
 });
```


### 全局配置

可以通过 `UseRequestProvider` 在根组件设置一些全局配置。

``` tsx
import { UseRequestProvider } from "@luban-hooks/use-request";

interface ResponseData<T> {
  code: number;
  msg?: string;
  data: T;
}

<UseRequestProvider<AxiosResponse<ResponseData<any>>
  value={{
    verifyResponse: (res) => res.status === 200 && res.data.code === 1,
    onSuccess: () => console.log("global success"),
    onError: (error) => console.log(error, "global error"),
    manual: false,
    defaultLoading: true,
    initialData: [],
  }}
>
  <App />
</UseRequestProvider>
```

**`UseRequestProvider` 并不支持全局的 `formatter` 和 `defaultParams` 参数**。

### 获取最新的状态
比如有以下这个例子：
```ts
import React, { FunctionComponent } from "react";
import axios from "axios";
import { useRequest } from "@luban-hooks/use-request";

interface ResponseData<T> {
  code: number;
  msg?: string;
  data: T;
}

function addUser(params: { name: string }) {
  return request.post<ResponseData<boolean>>(`/user/${params.name}`);
}

const User: FunctionComponent = () => {
  const [count, setCount] = useState(0);

  const { run: putAddUser } = useRequest(addUser, {
    manual: true,
    onSuccess: (data) => {
      if (data.code === 1) {
        console.info(count);
        // TODO do something
      }
    },
  });

  const addUserAndUpdateCount = () => {
    setCount(1);
    putAddUser({ name: "brendan" })
  };

  return (
    <ul>
      {/* TODO display user list */}
      <button type="button" onClick={addUserAndUpdateCount}>Add</button>
    </ul>
  );
};
```

上面这个例子在添加用户的同时更新了计数器 count，然后在 `onSuccess` 回调中打印了 `count`，你会发现这里 `count` 的值仍然是 0，但是 `count` 已经确实更新为了 2。
这是因为 `use-request` 在内部实现时，使用了 `useCallback` 对 `run` 方法进行了处理。可以设置 `reFetcherDeps` 来告诉 `useCallback` 不再返回旧的函数：
```ts
// ...
 const { run: putAddUser } = useRequest(addUser, {
    manual: true,
    reFetcherDeps: [count],
    onSuccess: (data) => {
      if (data.code === 1) {
        console.info(count);
        // TODO do something
      }
    },
  });
// ...
```

这样，当在 `onSuccess` 函数再次打印 `count` 时，就是最新的值了。
