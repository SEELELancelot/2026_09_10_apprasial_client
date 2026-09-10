import { ControlTableModel } from '@/myModel/ControlTableData/ControlTableData';
import { DisableExcelModel } from '@/myModel/DisableExcel/DisableExcel';
import { DropDownModel } from '@/myModel/DropDown/dropDown';
import { TableModel } from '@/myModel/TableData/Table';
import { history } from '@umijs/max';
import jwt_decode from 'jwt-decode';
import ROUTENAME from '../config/routesName';
const GetmyUserData = () => {
  let myUserData = {};
  let token = localStorage.getItem('token');
  try {
    const decode_data = jwt_decode(token);
    myUserData = decode_data;
    // console.log(myUserData);
  } catch (e) {
    console.log(e);
  }
  return myUserData;
};

const deleteTemp = () => {
  ControlTableModel.reset();
  TableModel.reset();
  DropDownModel.reset();
  DisableExcelModel.reset();
};
const deleteToken = () => {
  localStorage.removeItem('token');
  history.push(ROUTENAME.Login);
};

export { deleteTemp, deleteToken, GetmyUserData };
