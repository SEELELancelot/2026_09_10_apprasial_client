import {useEffect, useState} from "react";
import {documentUrl, ExcelAddPassword, onlyOfficeServer} from "@/networkReuest/Myaxios";
import ROUTENAME from "../../../../config/routesName";
import CryptoJS from "crypto-js";
import {DocumentEditor} from "@onlyoffice/document-editor-react";
import {useModel,history} from "@umijs/max";
import {ScaleTransform} from "../../../../utils/ScaleTransform";

const MergeAutBonusRecordExcel = (props) => {
  const {initialState} = useModel('@@initialState');

  let [userDoc, setUserDoc] = useState(`${documentUrl}/office/excel/空白.xlsx`);
  let [officeMode,setOfficeMode]=useState("edit");

  const [editorId, setEditorId] = "Editor";
  const onDocumentReady = function (event,data) {
    console.warn("Document is loaded")
  };

  useEffect(()=>{
    // ✨ 套用縮放修正
    ScaleTransform.apply();
    // 沒有登入
    if(Object.keys(initialState?.user).length===0){
      return history.replace(ROUTENAME.Login);
    }
    const params = new URL(window.location.href).searchParams;
    const [document] = [params.get("document")];
    const bytes  = CryptoJS.AES.decrypt(document, ExcelAddPassword);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    loadMergeExcel(originalText);
  },[]);

  const loadMergeExcel=async (excelName)=>{
    const pathName=`${documentUrl}/office/excel/EmployeeAutExcel/${excelName}`;
    userDoc=pathName;

    setTimeout(()=>{
      setdDocumentEditor(<DocumentEditor
        style={{ width: '100%', height: '100%' }} // ✅ 用 CSS 控制高度
        id={editorId}
        documentServerUrl={onlyOfficeServer}
        config={{
          "document": {
            "fileType": "xlsx",
            "title": excelName,
            "url": pathName,
            "permissions":{
              chat:true,
            }
          },

          "editorConfig": {
            "mode": officeMode,

            "customization": {
              "anonymous": {
                "request": false,
              },

              "comments": true,
              "compactHeader": false,
              "compactToolbar": false,
              "compatibleFeatures": false,
              "help": false,
              "hideRightMenu": true,
              "hideRulers": true,
              "integrationMode": "embed",
              "logo": {
                "url": ""
              },
              "macros": true,
              "macrosMode": "Warn",
              "mentionShare": true,
              "mobileForceView": true,
              "plugins": false,
              "toolbarHideFileName": false,
              "toolbarNoTabs": false,
              // "unit": "cm",
              zoom: ScaleTransform.getOnlyOfficeZoom(1.1), // 可選擇放大 10%

            },
            "lang": "zh-tw",
            "user": {
              "id":initialState?.user?.USER_ID,
              "name": initialState?.user?.USER_NAME
            },
          },
        }}

        events_onDocumentReady={onDocumentReady}
        onLoadComponentError={onLoadComponentError}
      />)
    },300); //等一段時間載入
  }

  const onLoadComponentError = function (errorCode, errorDescription) {
    switch (errorCode) {
      case -1: // Unknown error loading component
        console.log(errorDescription);
        break;
      case -2: // Error load DocsAPI from http://documentserver/
        console.log(errorDescription);
        break;
      case -3: // DocsAPI is not defined
        console.log(errorDescription);
        break;
    }
  };

  let [documentEditor,setdDocumentEditor]=useState(<DocumentEditor
    style={{ width: '100%', height: '100%' }} // ✅ 用 CSS 控制高度
    id={editorId}
    documentServerUrl={onlyOfficeServer}
    config={{
      "document": {
        "fileType": "xlsx",
        "title": "員工考核紀錄",
        "url": userDoc,
        "permissions":{
          chat:true,
        }
      },

      "editorConfig": {
        "customization": {
          "anonymous": {
            "request": false,
          },

          "comments": true,
          "compactHeader": false,
          "compactToolbar": false,
          "compatibleFeatures": false,
          "help": false,
          "hideRightMenu": true,
          "hideRulers": true,
          "integrationMode": "embed",
          "logo": {
            "url": ""
          },
          "macros": true,
          "macrosMode": "Warn",
          "mentionShare": true,
          "mobileForceView": true,
          "plugins": false,
          "toolbarHideFileName": false,
          "toolbarNoTabs": false,
          // "unit": "cm",
          zoom: ScaleTransform.getOnlyOfficeZoom(1.1), // 可選擇放大 10%

        },
        "lang": "zh-tw",
        "user": {
          "id":initialState?.user?.USER_ID,
          "name": initialState?.user?.USER_NAME
        },
        "mode": officeMode
      },
    }}

    events_onDocumentReady={onDocumentReady}
    onLoadComponentError={onLoadComponentError}
  />);

  return (
    <div
      className="editor-wrapper"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {documentEditor}
    </div>
  )
}
export default MergeAutBonusRecordExcel;
