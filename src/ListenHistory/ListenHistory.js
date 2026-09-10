import {InitDataFetchMethod} from "@/getInitDropDown/getInitDropDown";

const ListenHistory=async(pathname)=>{
  console.warn(pathname);
  switch (pathname){
    case "/EmployeeAppraisal":
      await InitDataFetchMethod.AllDropDownDownData();
      await InitDataFetchMethod.AllTableData();
      break;
  }
}

export {ListenHistory};
