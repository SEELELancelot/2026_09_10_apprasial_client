import {Button} from "antd";
import {TableModel} from "@/myModel/TableData/Table";
import {updateExcelSend} from "@/networkReuest/Myaxios";
import {useModel} from "@umijs/max";
import { DropDownModel } from '@/myModel/DropDown/dropDown';

const SubmitSendBonusModal=(props)=>{
  const {initialState} = useModel('@@initialState');

  return(
    <div>
      {
        initialState?.user?.USER_ID!=="6868"?
          <h1 style={{fontSize:'22px',color:'red'}}>一旦確認無誤將提交到總幹事
            <p style={{paddingLeft:'1px'}}>
              獎金調查便無法再次進行修改
            </p>
          </h1>:
          <h1 style={{fontSize:'22px',color:'red'}}>
            確認無誤
          </h1>
      }

      <div style={{textAlign:'center'}}>
        <Button type={"primary"}  onClick={async () => {
          props.setSubmitSendModal(false);
          const excelId=props?.excelData?.excelId;
          const result=await updateExcelSend(excelId);
          const{success,message}=result.data;

          if(success===1){
            const holiday = DropDownModel.getSelectedFestival("bonus");
            const year = DropDownModel.getSelectedYear("bonus");
            // ✅ 重新刷新對應的 holidayTable
            TableModel.setHolidayTable(holiday, year);
          }

        }}>確認無誤</Button>
      </div>
    </div> )
}
export default SubmitSendBonusModal;
