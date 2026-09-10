import { DropDownModel } from '@/myModel/DropDown/dropDown';
import { TableModel } from '@/myModel/TableData/Table';
import { deleteAutBonusById, deleteBonusById } from '@/networkReuest/Myaxios';
import { Button } from 'antd';

const DeleteBonusModal = (props) => {
  return (
    <div>
      <h2 style={{ color: 'red' }}>刪除獎金調查紀錄表</h2>
      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          style={{ backgroundColor: 'red' }}
          onClick={async () => {
            await props.setDeleteModal(false);

            const excelId = props?.deleteExcelData?.excelId;
            const holiday = DropDownModel.getSelectedFestival('bonus');
            const year = DropDownModel.getSelectedYear('bonus');

            let result;
            if (holiday === 'dragon') {
              result = await deleteBonusById(excelId); // 端午
            } else if (holiday === 'midAutumn') {
              result = await deleteAutBonusById(excelId); // 中秋
            }

            if (result) {
              const { success, message } = result.data;
              if (success === 1) {
                // ✅ 重新刷新對應的 holidayTable
                TableModel.setHolidayTable(holiday, year);
              }
            }
          }}
        >
          確定刪除
        </Button>
      </div>
    </div>
  );
};
export default DeleteBonusModal;
