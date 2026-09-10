import {Button} from "antd";
import {deleteYearExcelById} from "@/networkReuest/Myaxios";
import {TableModel} from "@/myModel/TableData/Table";

const DeleteYearApprasialModal=(props)=>{

  return(
    <div>
      <h2 style={{color:'red'}}>刪除考核紀錄表</h2>
      <div style={{textAlign:'center'}}>
        <Button type={"primary"} style={{backgroundColor:'red'}} onClick={async () => {
          await props.setDeleteModal(false);
          const excelId = props?.deleteExcelData?.excelId;
          console.log(excelId);
          const result=await deleteYearExcelById(excelId);
          console.log(result);
          const {success,message}=result.data
          console.log(success,message);
        //   介面重新刷新
          TableModel.setAppraisalYearTable();


         }}>確定刪除</Button>
      </div>
    </div>

  )
}
export default DeleteYearApprasialModal;
