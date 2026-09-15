import axios from "axios";
// import MockAdapter from 'axios-mock-adapter'
// import MockApi from '@/api/mock'
import { getProjectId, getToken } from "./token-util";

import * as loginJson from "@/../public/templates/login.json";
import { loginSettingModel } from "../routes/loginSettingModel";
import { getIcApiUrl } from "./apiUrl";

import router from "@/routes/index";
import { removeToken } from "./token-util";
import { EditorModule } from "@/store/modules/editor";

const setting = (loginJson.default as unknown) as loginSettingModel;

const instance = axios.create({
  baseURL: getIcApiUrl("device"),
  timeout: 120000,
  withCredentials: false
});

// request interceptor
instance.interceptors.request.use(
  config => {
    if (setting.needLogin) {
      let token = getToken();
      let gid = Number(getProjectId() ?? 0);
      if (!token) {
        token = EditorModule.agent_umbrella_token;
      }
      config.headers.post.token = token;
      config.headers.get.token = token;
      config.headers.post.gid = gid;
      config.headers.get.gid = gid;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// response interceptor
instance.interceptors.response.use(
  response => {
    const res = response.data;

    // 如果自定义code不为0，则将其判断为错误。
    if (res.code !== undefined && res.code !== 200) {
      // TODO
      // // 50008: 非法的token; 50012: 其他客户端登录了; 50014: Token 过期了;
      // if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
      //   // TODO
      // }
      // let msg=''
      // if(res.message){
      //   msg=res.message
      // }
      // else if(res.msg){
      //   msg=res.msg
      // }
      // else{
      //   msg='System Error'
      // }
      // return Promise.reject(new Error(msg))
      // const msg = res.msg as string
      // if(msg.indexOf('无效access_token') > 0)
      // {
      //   router.push('login')
      // }
      // else{
      //   return Promise.reject(new Error(res.message || 'System Error'))
      // }
    }

    return response;
  },
  error => {
    if (error.response.status == 403) {
      removeToken();
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
      }
      return Promise.reject({ data: { code: 403, message: "登录失效，请重新登录" } });
    } else if (error.response.status == 401) {
      removeToken();
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: "/login", query: { redirect: router.currentRoute.value.fullPath } });
      }
      return Promise.reject({ data: { code: 401, message: "登录失效，请重新登录" } });
    } else {
      return Promise.reject(error);
    }
  }
);

// if (import.meta.env.PROD) {
//   const mockAdapter = new MockAdapter(instance, { delayResponse: 500 })
//   MockApi(mockAdapter)
// }

export default instance;
