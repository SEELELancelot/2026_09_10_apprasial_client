import React, {useEffect, useRef, useState} from 'react';
import {useModel} from "@umijs/max";
import {Button, Form, Input} from "antd";
import './Login.css'
import LoginBanner from '../../../public/logo.png'
import jwt_decode from 'jwt-decode';
import {flushSync } from 'react-dom';
import {useNavigate} from "@/.umi/exports";
import {axiosLogin} from "@/networkReuest/Myaxios";
import ROUTENAME from "../../../config/routesName";


const Login = () => {
  const {initialState, loading, refresh, setInitialState} = useModel('@@initialState');

  const navigate = useNavigate();
  const [success, setSuccess] = useState(1);
  const [errorMessage, setErrorMessage] = useState();
  const [submitting, setSubmitting] = useState(false);
  const loginInFlight = useRef(false);

  const onFinish=async (values) => {
    if (loginInFlight.current) return;
    loginInFlight.current = true;
    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      const {account, password} = values;
      const result = await axiosLogin(account, password);
      const {success, message} = result.data;
      if (success === -1) {
        setSuccess(success);
        setErrorMessage(message);
        return;
      }
      const {token} = result.data;
      const decode_data = jwt_decode(token);
      localStorage.setItem("token", token);
      flushSync(() => {
        setInitialState((s) => ({...s,user: decode_data}));
      });
      navigate(ROUTENAME.LoginGetInitData);
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setSuccess(-1);
      setErrorMessage(typeof backendMessage === 'string' ? backendMessage
        : ['ECONNABORTED','ETIMEDOUT'].includes(error?.code)
          ? '登入逾時，請確認後端資料庫連線後再試'
          : error?.message === '登入回應格式錯誤，請確認後端服務版本'
            ? error.message : '無法完成登入，請確認後端服務是否正常');
    } finally {
      loginInFlight.current = false;
      setSubmitting(false);
    }
  }

  const onFinishFailed = (errorInfo) => {
    setErrorMessage('請填寫帳號與密碼');
  };
  return (

    <div className={"MyPage"} style={{display:'flex',justifyContent:'center'}}>
      <div className={"fishBanner"}>
        <img src={LoginBanner} height={170}  />

      </div>

      <div className={"wrap_content"}>

         <div className={"LoginContent"}>
           <div style={{position:'relative',top:'-10px',textAlign:'center'}}>
             <span style={{color:'red'}}>{errorMessage}</span>
           </div>
           <h1 style={{marginBottom: '30px', textAlign: 'center',color:'white',fontSize:24}}>員工考核</h1>

          <Form
            name="basic"

            wrapperCol={{
              span: 16,
            }}
            style={{
              maxWidth: 600,
            }}

            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
          >
            <Form.Item
              label="帳號"
              className={"login_account"}
              wrapperCol={{
                offset: 2
              }}
              name="account"
              rules={[
                {
                  required: true,
                  message: '請輸入你的帳號',
                },
              ]}
            >
              <Input/>
            </Form.Item>

            <Form.Item
              label="密碼"
              name="password"
              className={"login_password"}

              wrapperCol={{
                offset: 2
              }}
              rules={[
                {
                  required: true,
                  message: '請輸入你的密碼',
                },
              ]}
            >
              <Input.Password/>
            </Form.Item>

            <Form.Item
              wrapperCol={{
                offset: 8,

              }}
            >
              <Button loading={submitting} disabled={submitting} style={{width:'100px',marginTop:'20px'}} type="primary" htmlType="submit" className={"submit_button"}>
                登入
              </Button>

            </Form.Item>
          </Form>
        </div>
      </div>


    </div>
  );
};

export default (Login);
