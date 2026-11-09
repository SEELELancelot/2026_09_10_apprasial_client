import {Button} from "antd";
import {ExcelAddPassword, mergeAppraisalExcel} from "@/networkReuest/Myaxios";
import ROUTENAME from "../../../config/routesName";
import CryptoJS  from 'crypto-js';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";



const MyMergeDocumentModal = (props) => {
  const MySwal = withReactContent(Swal)

  return (
    <div>
      <h1 style={{fontSize: '22px', color: 'blue'}}>
        確定合併?
      </h1>

      <div style={{textAlign: 'center'}}>
        <Button type={"primary"} onClick={async () => {
          props?.setMergeDocumentModal(false);
          props?.setTableRowKey([]);
          props?.setcheckData([]);

          console.log(props.checkData);
          const result=await mergeAppraisalExcel(props?.checkData);
          const {success,message}=result.data;
          console.log(success,message);
          if(success===1) {


            const ciphertext = CryptoJS.AES.encrypt(message?.excelName, ExcelAddPassword);
            const sendAddPasswordText=encodeURIComponent(ciphertext);
            setTimeout(()=>{
              const newTab = window.open(`${ROUTENAME?.MergeAppraisalRecordExcel}?document=${sendAddPasswordText}`, '_blank');

            },50);

          }else {
            await MySwal.fire({
              target: document.getElementById('EmployeeAppraisalTable'),
              title: '合併失敗',
              text: typeof message === 'string' ? message : '請檢查選取文件的版本、評分及加密狀態',
              confirmButtonText: "關閉",
            })
          }


        }}>合併</Button>
      </div>
    </div>
  )
}
export default MyMergeDocumentModal;
