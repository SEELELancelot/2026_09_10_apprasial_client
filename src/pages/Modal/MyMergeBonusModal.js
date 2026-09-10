import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { Button } from "antd";
import { ExcelAddPassword, mergeAutBonusExcel, mergeBonusExcel } from "@/networkReuest/Myaxios";
import CryptoJS from "crypto-js";
import ROUTENAME from "../../../config/routesName";
import { useSnapshot } from "valtio";
import { TableModel } from "@/myModel/TableData/Table"; // ✅ 用唯一狀態

const MyMergeBonusModal = (props) => {
  const MySwal = withReactContent(Swal);
  const AppraisalTableSnap = useSnapshot(TableModel);

  // ✅ 把 API 與 Route 抽成 map
  const mergeApiMap = {
    dragon: mergeBonusExcel,       // 端午
    midAutumn: mergeAutBonusExcel, // 中秋
  };

  const routeMap = {
    dragon: ROUTENAME.MergeBonusRecordExcel,       // 端午合併預覽
    midAutumn: ROUTENAME.MergeAutBonusRecordExcel, // 中秋合併預覽
  };

  return (
    <div>
      <h1 style={{ fontSize: "22px", color: "blue" }}>確定合併?</h1>

      <div style={{ textAlign: "center" }}>
        <Button
          type="primary"
          onClick={async () => {
            const holiday = AppraisalTableSnap.currentHoliday; // ✅ 使用唯一節日狀態
            const mergeApi = mergeApiMap[holiday];
            const route = routeMap[holiday];

            props?.setMergeDocumentModal(false);
            props?.setTableRowKey([]);
            props?.setcheckData([]);

            if (!mergeApi || !route) return;

            try {
              const result = await mergeApi(props?.checkData);
              const { success, message } = result.data;

              if (success === 1) {
                const ciphertext = CryptoJS.AES.encrypt(message?.excelName, ExcelAddPassword);
                const sendAddPasswordText = encodeURIComponent(ciphertext);

                setTimeout(() => {
                  window.open(`${route}?document=${sendAddPasswordText}`, "_blank");
                }, 50);
              } else {
                await MySwal.fire({
                  target: document.getElementById("EmployeeAppraisalTable"),
                  title: (
                    <span style={{ color: "red", fontSize: "24px" }}>
                      合併失敗 (請檢查是否有加密Excel存在)
                    </span>
                  ),
                  confirmButtonText: "關閉",
                });
              }
            } catch (e) {
              console.error("❌ merge failed", e);
              await MySwal.fire({
                target: document.getElementById("EmployeeAppraisalTable"),
                title: (
                  <span style={{ color: "red", fontSize: "24px" }}>
                    合併失敗 (系統錯誤)
                  </span>
                ),
                confirmButtonText: "關閉",
              });
            }
          }}
        >
          合併
        </Button>
      </div>
    </div>
  );
};

export default MyMergeBonusModal;
