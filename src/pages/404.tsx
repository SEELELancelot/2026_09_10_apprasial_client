import { history } from '@umijs/max';
import { QuestionOutlined   } from '@ant-design/icons';

import { Button, Result } from 'antd';
import React from 'react';
const NoFoundPage: React.FC = () => (
  <Result
    icon={<QuestionOutlined />  }
      subTitle="沒有該頁面存在"
    extra={
      <Button type="primary" onClick={() => history.push('/login')}>
        首頁
      </Button>
    }
  />
);
export default NoFoundPage;
