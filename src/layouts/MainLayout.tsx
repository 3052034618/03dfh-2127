import React, { useState } from 'react';
import { Layout, Menu, theme, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  StarOutlined,
  ShopOutlined,
  UserOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '运营看板' },
  { key: '/drivers', icon: <CarOutlined />, label: '车源库' },
  { key: '/fleets', icon: <TeamOutlined />, label: '车队管理' },
  { key: '/stores', icon: <ShopOutlined />, label: '门店列表' },
  { key: '/orders', icon: <UnorderedListOutlined />, label: '订单中心' },
  { key: '/evaluations', icon: <StarOutlined />, label: '服务评价' },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = menuItems.find(item => 
    location.pathname.startsWith(item.key) || 
    (item.key === '/orders' && location.pathname === '/orders/publish')
  )?.key || '/dashboard';

  const userMenu = {
    items: [
      { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
      { type: 'divider' as const },
      { key: 'logout', label: '退出登录' },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 20,
          background: 'rgba(255,255,255,0.08)',
          margin: 16,
          borderRadius: 8,
        }}>
          <CarOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && (
            <Title level={4} style={{ color: '#fff', margin: '0 0 0 12px', fontWeight: 600 }}>
              车源调度中心
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined 
                style={{ fontSize: 20, cursor: 'pointer' }} 
                onClick={() => setCollapsed(false)} 
              />
            ) : (
              <MenuFoldOutlined 
                style={{ fontSize: 20, cursor: 'pointer' }} 
                onClick={() => setCollapsed(true)} 
              />
            )}
          </div>
          <Space size={24}>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <span>区域运营·李主管</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
