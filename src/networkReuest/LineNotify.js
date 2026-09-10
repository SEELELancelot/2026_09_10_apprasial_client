import {documentUrl, mybaseUrl, onlyOfficeServer, serverPort} from "@/networkReuest/Myaxios";

class LineNotify{
  static LineAuthUrl="https://notify-bot.line.me/oauth/authorize?";
  static LineNotifyClientId="uk55jb2QVy7O1PhpBslAEn";
  static redirect_uri="http://localhost:8000/officalCar";

  static linkLineNotify=async ()=>{
    if (window.location.host.indexOf("192.168") > -1) {
      LineNotify.redirect_uri="http://192.168.0.87:5000/officalCar";
    } else if (window.location.host.indexOf("localhost") > -1) {
      LineNotify.redirect_uri="http://localhost:8000/officalCar";
    } else {
      LineNotify.redirect_uri="http://59.120.221.198:5000/officalCar";
    }
    let URL = LineNotify.LineAuthUrl;
    URL += 'response_type=code';
    URL += `&client_id=${LineNotify.LineNotifyClientId}`;
    URL += `&redirect_uri=${LineNotify.redirect_uri}`;
    URL += '&scope=notify';
    URL += `&state=no_state`;

    window.location.href = URL;
  }
}
export {LineNotify};
