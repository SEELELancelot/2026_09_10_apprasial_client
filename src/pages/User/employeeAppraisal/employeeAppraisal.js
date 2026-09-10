import EmployeeAppraisalUsually from "@/pages/User/employeeAppraisalUsually/employeeAppraisalUsually";
import {useSnapshot} from "valtio";
import {ControlTableModel} from "@/myModel/ControlTableData/ControlTableData";
import EmployeeAppraisalYearFinal from "@/pages/User/employeeYearFinalAppraisal/employeeAppraisalYearFinal";
import TableConstants from "@/myModel/Constants/TableConstants";
import EmployeeBonusSurvey from "@/pages/User/employeeBonusSurvey/employeeBonusSurvey";

const EmployeeAppraisal = () => {
  const controlTableState = useSnapshot(ControlTableModel);

  const components = {
    [TableConstants.employeeAppraisalUsually]: <EmployeeAppraisalUsually />,
    [TableConstants.employeeAppraisalYearFinal]: <EmployeeAppraisalYearFinal />,
    [TableConstants.employeeBonusSurvey]: <EmployeeBonusSurvey />,
  };

  return <div>{components[controlTableState.AppraisalTableType] || null}</div>;
};
export default EmployeeAppraisal;

