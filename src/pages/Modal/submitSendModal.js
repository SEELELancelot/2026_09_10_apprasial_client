import {Button} from "antd";
import {TableModel} from "@/myModel/TableData/Table";
import {updateExcelSend} from "@/networkReuest/Myaxios";
import {useModel} from "@umijs/max";

const SubmitSendModal=(props)=>{
  const {initialState} = useModel('@@initialState');

  return(
   <div>
     {
       initialState?.user?.USER_ID!=="6868"?
         <h1 style={{fontSize:'22px',color:'red'}}>一旦確認無誤將提交到總幹事
           <p style={{paddingLeft:'1px'}}>
             考核紀錄便無法再次進行修改
           </p>
         </h1>:
         <h1 style={{fontSize:'22px',color:'red'}}>
           員工考核紀錄確認無誤
         </h1>
     }

     <div style={{textAlign:'center'}}>
       <Button type={"primary"}  onClick={async () => {
         props.setSubmitSendModal(false);
         const excelId=props?.excelData?.excelId;
         const result=await updateExcelSend(excelId);
         const{success,message}=result.data;
         console.log(success,message);
         if(success===1){
             TableModel.setAppraisalTable();
             TableModel.setAppraisalYearTable();
         }

       }}>確認無誤</Button>
     </div>
   </div> )
}
export default SubmitSendModal;
