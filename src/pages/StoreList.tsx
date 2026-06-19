import React from 'react';
import { Table, Card, Tag, Space, Typography, Avatar, Rate } from 'antd';
import { ShopOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined, CarOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const StoreList: React.FC = () => {
  const { stores, orders, drivers } = useApp();

  const getStoreStats = (storeId: string) => {
    const storeOrders = orders.filter(o => o.storeId === storeId);
    const todayOrders = storeOrders.filter(o => dayjs(o.departureTime).isSame(dayjs(), 'day'));
    const pending = todayOrders.filter(o => o.status === '待确认').length;
    const usualDrivers = drivers.filter(d => d.usualStores.includes(storeId));
    const completed = storeOrders.filter(o => o.status === '已完成').length;
    return { todayOrders: todayOrders.length, pending, usualDrivers: usualDrivers.length, completed };
  };

  const columns = [
    {
      title: '门店信息',
      key: 'store',
      width: 260,
      render: (_: unknown, record: typeof stores[0]) => {
        const stats = getStoreStats(record.id);
        return (
          <Space>
            <Avatar size={48} style={{ backgroundColor: '#13c2c2', verticalAlign: 'middle' }} icon={<ShopOutlined />} />
            <Space orientation="vertical" size={2}>
              <Text strong style={{ fontSize: 15 }}>{record.name}</Text>
              <Space size={12}>
                <Space size={4}>
                  <CarOutlined style={{ fontSize: 12, color: '#999' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>常跑司机 {stats.usualDrivers} 位</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>累计完成 {stats.completed} 单</Text>
              </Space>
            </Space>
          </Space>
        );
      },
    },
    {
      title: '所在区域',
      dataIndex: 'district',
      key: 'district',
      width: 100,
      render: (district: string) => <Tag color="cyan">{district}</Tag>,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#999' }} />
          <span>{address}</span>
        </Space>
      ),
    },
    {
      title: '门店负责人',
      dataIndex: 'manager',
      key: 'manager',
      width: 120,
      render: (manager: string, record: typeof stores[0]) => (
        <Space orientation="vertical" size={0}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{manager}</Text>
          </Space>
          <Space size={4}>
            <PhoneOutlined style={{ fontSize: 12, color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '今日用车',
      key: 'today',
      width: 180,
      render: (_: unknown, record: typeof stores[0]) => {
        const stats = getStoreStats(record.id);
        return (
          <Space orientation="vertical" size={2}>
            <Space>
              <Text strong style={{ fontSize: 16, color: '#1677ff' }}>{stats.todayOrders}</Text>
              <Text type="secondary">单需求</Text>
            </Space>
            {stats.pending > 0 ? (
              <Tag color="orange">待确认 {stats.pending} 单</Tag>
            ) : (
              <Tag color="green">全部已派单</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '运营评分',
      key: 'rating',
      width: 140,
      render: () => (
        <Space orientation="vertical" size={2}>
          <Rate disabled allowHalf value={4.7} style={{ fontSize: 14 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>基于 128 条评价</Text>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>门店列表</Title>
      <Text type="secondary">查看各连锁门店信息及日常用车需求</Text>

      <Card style={{ marginTop: 16 }} size="small">
        <Table
          dataSource={stores}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 家门店` }}
        />
      </Card>
    </div>
  );
};

export default StoreList;
