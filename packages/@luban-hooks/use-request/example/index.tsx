import React, { FunctionComponent, CSSProperties, useState, ChangeEvent } from "react";
import { render } from "react-dom";
import axios from "axios";

import { useRequest } from "../src";

const request = axios.create({ baseURL: "http://localhost:3000" });

interface Response<T> {
  code: number;
  msg?: string;
  data: T;
}

interface UserItem {
  id: number;
  name: string;
}

interface GetUserListQuery {
  name?: string;
}

function getUserList(params: GetUserListQuery) {
  const url = params.name ? `/api/users?name=${params.name}` : "/api/users";
  return request.get<Response<UserItem[]>>(url);
}

function addUser(params: { name: string }) {
  return request.post<Response<boolean>>(`/api/user/${params.name}`);
}

function delUser(params: { id: number }) {
  return request.delete<Response<boolean>>(`/api/user/${params.id}`);
}

const style: CSSProperties = {
  height: "30px",
  outline: "none",
  border: "none",
  borderRadius: "4px",
  marginRight: "12px",
  fontSize: "16px",
};

const UserList: FunctionComponent = () => {
  const [value, setValue] = useState<string>("");

  const { data: userList, run: fetchUserList } = useRequest(getUserList, {
    initialData: { data: [] },
    defaultParams: {},
  });

  const { run: putAddUser } = useRequest(addUser, {
    manual: true,
    onSuccess: (data) => {
      if (data.code === 1) {
        fetchUserList({});
        setValue("");
      }
    },
  });

  const { run: putDelUser } = useRequest(delUser, {
    manual: true,
    onSuccess: (data) => {
      if (data.code === 1) {
        fetchUserList({});
        setValue("");
      }
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value: searchKeyword },
    } = event;
    if (searchKeyword.length > 20) {
      return;
    }
    setValue(searchKeyword);
  };

  const handleSearch = () => {
    fetchUserList({ name: value });
  };

  const handleAddUser = () => {
    if (value) {
      putAddUser({ name: value });
    }
  };

  return (
    <div style={{ marginTop: "12px", width: "500px" }}>
      <div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          style={{ ...style, textIndent: "12px", width: "320px" }}
          placeholder="try input(just 20 chars) and check Network"
        />
        <button type="button" onClick={handleSearch} style={{ ...style, cursor: "pointer" }}>
          search
        </button>
        <button type="button" onClick={handleAddUser} style={{ ...style, cursor: "pointer" }}>
          add
        </button>
      </div>
      <ul style={{ padding: "0" }}>
        {userList.data.map((user) => {
          return (
            <li
              key={user.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: "32px" }}>·</span>
              <span>{user.name}</span>
              <button
                type="button"
                style={{
                  fontSize: "12px",
                  cursor: "pointer",
                  fontStyle: "normal",
                  color: "#ccc",
                  border: "none",
                  outline: "none",
                }}
                onClick={() => putDelUser({ id: user.id })}
              >
                delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

render(<UserList />, document.getElementById("root"));
