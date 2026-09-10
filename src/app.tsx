import './tailwind.css';

import {Footer} from '@/components';
import type {RunTimeLayoutConfig} from '@umijs/max';
import {history} from '@umijs/max';
import {errorConfig} from './requestErrorConfig';
import React from 'react';
import defaultSettings from '../config/defaultSettings';
import {GetmyUserData} from "../utils/handleToken.js";

import {ListenHistory} from "./ListenHistory/ListenHistory";
import LoginHeader from '@/pages/LoginHeader/LoginHeader'

import ROUTENAME from "../config/routesName";
const loginPath = ROUTENAME.Login;

export async function getInitialState(): Promise<{}> {

  const getUserData = GetmyUserData();
  // init_getDropDown();
  console.warn(getUserData)

  if (Object.keys(getUserData).length === 0) {
  } else {
    const pathname = history.location.pathname;
    ListenHistory(pathname);
  }
  //不記住 每次都要重新登入

  // if(getUserData){
  //   // deleteToken();
  //   history.push(loginPath);
  // }else{
  //   history.push(loginPath);
  // }
  // history.push(loginPath); //不管怎樣都跳轉
  return Promise.resolve({user: getUserData, settings: defaultSettings});
}

export const layout: RunTimeLayoutConfig = ({initialState, setInitialState}) => {
  const getUserData = GetmyUserData(); //當切換頁面時檢查token的value有無更新
  setInitialState((s) => ({
    ...s,
    user: getUserData,
  }));

  if (Object.keys(initialState?.user).length === 0) {
    console.log("沒有data");
    history.replace(loginPath);
  }

  return {
    actionsRender: () => [],
    headerContentRender: () => {
      return (
        <LoginHeader/>
      )
    },
    footerRender: () => <Footer/>,
    onPageChange: async () => {
    },
    // menuHeaderRender:()=>undefined,
    unAccessible: <div>無權限</div>,
    ...initialState?.settings,
  };
};


export const request = {
  ...errorConfig,
};
