import {useModel} from "@umijs/max";
import {Button, Modal} from "antd";
import {deleteTemp,deleteToken} from "../../../utils/handleToken";
import React from "react";

const LoginHeader=()=>{
  const {initialState} = useModel('@@initialState');
  const {USER_ID, USER_NAME, BRANCH_ID, BRANCH_NAME, MISS_ID, MISS_NAME} = initialState?.user;
  return(
    <div>

      <div>
        <div style={{float:'right'}}>
          <span style={{marginRight: '5px'}}>{USER_NAME ? USER_NAME : ""}</span>
          <span style={{marginRight: '10px'}}>{BRANCH_NAME ? `(${BRANCH_NAME})` : ""}</span>

          <Button style={{marginTop: '10px'}} type={"primary"} onClick={() => {
            deleteTemp();
            //刪除 token 重新獲得狀態
            deleteToken();
          }}>登出</Button>
        </div>

      </div>
    </div>
  )

}
export default LoginHeader;
