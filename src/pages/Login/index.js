import React, {useEffect, useState} from 'react';
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

  const onFinish=async (values) => {
    const {account, password} = values;
    console.log(account,password);
    const result = await axiosLogin(account, password);
    const {success, message} = result.data;
    console.log(success);
    if (success === -1) {
      setSuccess(success);
      setErrorMessage(message);
    } else {
      //    成功 獲取token 設定token
      const {token} = result.data;
      console.log("檢查登入");
      console.log(token);
      const decode_data = jwt_decode(token);
      console.log(decode_data);

      await localStorage.setItem("token", token);

      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          user: decode_data,
        }));
      });

      navigate(ROUTENAME.LoginGetInitData);

    }


  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
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
              <Button style={{width:'100px',marginTop:'20px'}} type="primary" htmlType="submit" className={"submit_button"}>
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
