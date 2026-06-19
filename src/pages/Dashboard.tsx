import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Space, Typography, Badge, Alert } from 'antd';
import {
  CarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { orders, drivers, stores } = useApp();

  const pendingOrders = orders.filter(o => o.status === '待确认');
  const dispatchedOrders = orders.filter(o => o.status === '已派单');
  const inServiceOrders = orders.filter(o => o.status === '服务中');
  const completedOrders = orders.filter(o => o.status === '已完成');

  const lowBudgetThreshold = 150;
  const lowBudgetOrders = pendingOrders.filter(o => o.budget < lowBudgetThreshold);

  const storeOrderStatus = stores.map(store => {
    const storeOrders = orders.filter(o => o.storeId === store.id && 
      dayjs(o.departureTime).isAfter(dayjs().subtract(1, 'day')));
    const pending = storeOrders.filter(o => o.status === '待确认').length;
    const total = storeOrders.length;
    return {
      ...store,
      total,
      pending,
      confirmed: total - pending,
      confirmRate: total === 0 ? 100 : Math.round(((total - pending) / total) * 100),
    };
  });

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      ellipsis: true,
    },
    {
      title: '出发时间',
      dataIndex: 'departureTime',
      key: 'departureTime',
      width: 160,
      render: (val: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>{dayjs(val).format('MM-DD HH:mm')}</span>
        </Space>
      ),
    },
    {
      title: '人数',
      dataIndex: 'peopleCount',
      key: 'peopleCount',
      width: 80,
      render: (val: number) => `${val}人`,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (val: number) => {
        const isLow = val < lowBudgetThreshold;
        return (
          <Space>
            {isLow && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            <Text type={isLow ? 'danger' : undefined} strong>¥{val}</Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
          '待确认': { color: 'orange', icon: <ClockCircleOutlined /> },
          '已派单': { color: 'blue', icon: <CarOutlined /> },
          '服务中': { color: 'processing', icon: <TeamOutlined /> },
          '已完成': { color: 'green', icon: <CheckCircleOutlined /> },
        };
        const cfg = statusMap[status] || { color: 'default', icon: null };
        return <Tag color={cfg.color} icon={cfg.icon}>{status}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>运营看板</Title>
      <Text type="secondary">实时监控各门店车源调度状态，及时发现异常订单</Text>

      {lowBudgetOrders.length > 0 && (
        <Alert
          style={{ marginTop: 16, marginBottom: 16 }}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          title={`${lowBudgetOrders.length} 个订单预算偏低，可能无人接单，请及时联系门店调整或协调车队`}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="待确认订单"
              value={pendingOrders.length}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="已派单"
              value={dispatchedOrders.length}
              prefix={<CarOutlined style={{ color: '#1677ff' }} />}
              styles={{ content: { color: '#1677ff' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="服务中"
              value={inServiceOrders.length}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="今日已完成"
              value={completedOrders.filter(o => dayjs(o.departureTime).isSame(dayjs(), 'day')).length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Badge count={storeOrderStatus.filter(s => s.pending > 0).length} />
                <span>门店车辆确认进度</span>
              </Space>
            }
            size="small"
          >
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {storeOrderStatus.map(store => (
                <div key={store.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      <Text strong>{store.name}</Text>
                      {store.pending > 0 && (
                        <Tag color="orange">待确认 {store.pending}</Tag>
                      )}
                    </Space>
                    <Text type="secondary">{store.confirmed}/{store.total} 已派单</Text>
                  </div>
                  <Progress 
                    percent={store.confirmRate} 
                    size="small"
                    strokeColor={store.confirmRate === 100 ? '#52c41a' : '#1677ff'}
                    showInfo={false}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Badge count={drivers.filter(d => d.status === '出车中').length} color="blue" />
                <span>在岗司机状态</span>
              </Space>
            }
            size="small"
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="在岗"
                  value={drivers.filter(d => d.status === '在岗').length}
                  styles={{ content: { color: '#52c41a', fontSize: 20 } }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="出车中"
                  value={drivers.filter(d => d.status === '出车中').length}
                  styles={{ content: { color: '#1677ff', fontSize: 20 } }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="休息"
                  value={drivers.filter(d => d.status === '休息').length}
                  styles={{ content: { color: '#8c8c8c', fontSize: 20 } }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Text type="secondary">合作车队</Text>
              <Space wrap style={{ marginTop: 8 }}>
                {['金牌车队', '顺达车队', '安捷车队', '星程车队', '合众车队'].map(name => (
                  <Tag key={name} color="blue">{name}</Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        style={{ marginTop: 16 }}
        title="近期订单追踪"
        size="small"
      >
        <Table
          dataSource={orders}
          columns={orderColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
