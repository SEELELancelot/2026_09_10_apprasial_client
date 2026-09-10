import {useEffect} from "react";
import {history} from 'umi';
import ROUTENAME from "../../../config/routesName";
import {ListenHistory} from "@/ListenHistory/ListenHistory";

const LoginGetInitData = () => {


  useEffect(() => {
    console.log("初始化登入事件");
    const unlisten = history.listen((action) => {
      const pathname = action.location.pathname;
      ListenHistory(pathname);
    });
    history.push(ROUTENAME.employee_appraisalTabs); //跳轉到首頁介面

    return () => {
      unlisten();
    };
  }, []);

}
export default LoginGetInitData;
