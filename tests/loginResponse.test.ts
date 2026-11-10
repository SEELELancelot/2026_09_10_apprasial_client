import {readLoginResponse} from '../src/utils/loginResponse';

it('validates login success and failure without accepting incomplete responses',()=>{
  expect(readLoginResponse({success:1,token:'signed-token'})).toEqual({success:1,token:'signed-token'});
  expect(readLoginResponse({success:-1,message:'帳號或密碼錯誤'})).toEqual({success:-1,message:'帳號或密碼錯誤'});
  for(const input of [null,{}, {success:1},{success:1,token:4},{success:-1}]) expect(()=>readLoginResponse(input)).toThrow('登入回應格式錯誤');
});
