import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import DriverManagement from './pages/DriverManagement';
import FleetManagement from './pages/FleetManagement';
import StoreList from './pages/StoreList';
import OrderCenter from './pages/OrderCenter';
import EvaluationPage from './pages/EvaluationPage';
import { AppProvider } from './context/AppContext';
import 'dayjs/locale/zh-cn';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#001529',
          },
          Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
          },
        },
      }}
    >
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="drivers" element={<DriverManagement />} />
              <Route path="fleets" element={<FleetManagement />} />
              <Route path="stores" element={<StoreList />} />
              <Route path="orders" element={<OrderCenter />} />
              <Route path="evaluations" element={<EvaluationPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App;
