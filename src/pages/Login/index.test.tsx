import React from 'react';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import Login from './index';
import {axiosLogin} from '@/networkReuest/Myaxios';

jest.mock('@umijs/max',()=>({useModel:()=>({initialState:{},setInitialState:jest.fn()})}));
jest.mock('@/.umi/exports',()=>({useNavigate:()=>jest.fn()}),{virtual:true});
jest.mock('@/networkReuest/Myaxios',()=>({axiosLogin:jest.fn()}));
jest.mock('../../../public/logo.png',()=> 'login-logo');
afterEach(()=>{cleanup();jest.clearAllMocks();});

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('帳號'),{target:{value:'TEST'}});
  fireEvent.change(screen.getByLabelText('密碼'),{target:{value:'secret'}});
  const button=screen.getByRole('button',{name:'登 入'});
  fireEvent.click(button);
  return button;
}

it('prevents duplicate login requests and restores the button after a timeout',async()=>{
  let rejectRequest:(reason:unknown)=>void=()=>{};
  (axiosLogin as jest.Mock).mockImplementation(()=>new Promise((_,reject)=>{rejectRequest=reject;}));
  render(<Login/>);
  fillAndSubmit();
  await waitFor(()=>expect(axiosLogin).toHaveBeenCalledTimes(1));
  await waitFor(()=>expect((screen.getByRole('button',{name:'登 入'}) as HTMLButtonElement).disabled).toBe(true));
  const button=screen.getByRole('button',{name:'登 入'});
  fireEvent.submit(button.closest('form')!);
  await act(async()=>{await Promise.resolve();});
  expect(axiosLogin).toHaveBeenCalledTimes(1);
  await act(async()=>{rejectRequest({code:'ECONNABORTED'});});
  expect(await screen.findByText('登入逾時，請確認後端資料庫連線後再試')).toBeTruthy();
  await waitFor(()=>expect((screen.getByRole('button',{name:'登 入'}) as HTMLButtonElement).disabled).toBe(false));
});

it('shows the backend database error instead of leaving the login pending',async()=>{
  (axiosLogin as jest.Mock).mockRejectedValue({response:{data:{message:'主系統資料庫驗證失敗，請確認後端資料庫連線設定'}}});
  render(<Login/>);
  fillAndSubmit();
  expect(await screen.findByText('主系統資料庫驗證失敗，請確認後端資料庫連線設定')).toBeTruthy();
});
