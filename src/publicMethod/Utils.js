function getBlob(url,cb) {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = function() {
    if (xhr.status === 200) {
      cb(xhr.response);
    }
  }
  xhr.send();
}
function saveAs(blob, filename) {
  if (window.navigator.msSaveOrOpenBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}

class MyUtils{
   static urlToObject= async(url,fileName)=> {
     // console.warn(url);
     try{
       const response = await fetch(url);
       // here image is url/location of image
       const blob = await response.blob();
       const file = new File([blob], fileName, {type: blob.type});

       return file;
     }catch (e){
       console.log(e)
       return null;
     }
  }
  static formatNum=(num)=> {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // 清單顯示用：保留表單名稱，移除系統產生的「(YYYY-MM-DD HH-mm-ss).xlsx」尾碼。
  // 原始檔名仍保留給下載、預覽與 API 使用。
  static formatExcelDisplayName = (fileName) => {
    return String(fileName || '').replace(
      /\s*\(\d{4}-\d{2}-\d{2}\s+\d{2}-\d{2}-\d{2}\)\.xlsx$/i,
      '',
    );
  }


  static isFullscreenElement=()=> {
     let fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
    // console.log(fullscreenEle);
    if(fullscreenElement===undefined){
      return false;
    }else{
      return fullscreenElement!==null;
    }
  }
  static ChangeBodyScroll=()=>{
    if(this.isFullscreenElement()){
      document.body.style.overflowY="scroll"
    }
  }

  static exitFullscreen() {
    if(document.exitFullScreen) {
      document.exitFullScreen();
    } else if(document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if(document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if(element.msExitFullscreen) {
      element.msExitFullscreen();
    }
  }



 static fileDownload(url, filename) {
    getBlob(url, function(blob) {
      saveAs(blob, filename);
    })
  }

}

export {MyUtils};
