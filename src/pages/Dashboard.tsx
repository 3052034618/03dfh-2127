import React from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Space, Typography, Badge, Alert, Steps, Button, List } from 'antd';
import {
  CarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  AlertOutlined,
  StopOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useApp, SERVICE_STEPS } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { orders, drivers, stores } = useApp();
  const navigate = useNavigate();

  const pendingOrders = orders.filter(o => o.status === '待确认');
  const dispatchedOrders = orders.filter(o => o.status === '已派单');
  const inServiceOrders = orders.filter(o => o.status === '服务中');
  const completedOrders = orders.filter(o => o.status === '已完成');

  const lowBudgetThreshold = 150;
  const lowBudgetOrders = pendingOrders.filter(o => o.budget < lowBudgetThreshold);

  const abnormalOrders = orders
    .map(o => {
      let type: '' | '已派单未出发' | '司机未到店' | '服务中未完成' = '';
      let hoursStuck = 0;
      const step = o.currentStep;
      const refTime = step ? o.stepTimestamps?.[step] : undefined;
      const baseTime = refTime || o.departureTime;
      hoursStuck = Math.max(0, dayjs().diff(dayjs(baseTime), 'hour'));
      
      if (o.status === '已派单') {
        if (!step || step === '已派单') {
          if (hoursStuck >= 1) type = '已派单未出发';
        } else if (step === '司机已出发') {
          if (hoursStuck >= 2) type = '司机未到店';
        }
      } else if (o.status === '服务中') {
        if (step === '司机已出发' || !step) {
          if (hoursStuck >= 2) type = '司机未到店';
        } else if (step === '已到店' || step === '已接到玩家') {
          if (hoursStuck >= 4) type = '服务中未完成';
        }
      }
      return { order: o, type, hoursStuck };
    })
    .filter(x => x.type !== '')
    .sort((a, b) => b.hoursStuck - a.hoursStuck);

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

      <Card 
        style={{ marginTop: 16 }} 
        size="small"
        title={
          <Space>
            <Badge status="processing" />
            <span>服务进度追踪</span>
          </Space>
        }
      >
        <Steps
          size="small"
          current={-1}
          items={SERVICE_STEPS.map(step => {
            const count = orders.filter(o => o.currentStep === step).length;
            return {
              title: step,
              description: count > 0 ? `${count} 单` : '',
              status: count > 0 ? 'process' : 'wait',
              icon: count > 0 ? (
                <Badge count={count} size="small" style={{ backgroundColor: '#1677ff' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>{count}</Text>
                  </div>
                </Badge>
              ) : undefined,
            };
          })}
        />
      </Card>

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
        title={
          <Space>
            <Badge count={abnormalOrders.length} color="#ff4d4f" />
            <AlertOutlined style={{ color: '#ff4d4f' }} />
            <span>异常跟进区</span>
          </Space>
        }
        size="small"
        extra={
          abnormalOrders.length > 0 && (
            <Button 
              size="small" 
              type="primary" 
              onClick={() => navigate('/orders')}
              icon={<RightOutlined />}
            >
              去订单中心处理
            </Button>
          )
        }
      >
        {abnormalOrders.length === 0 ? (
          <Alert
            type="success"
            showIcon
            title="当前没有异常订单"
            description="所有派单都在正常推进中"
          />
        ) : (
          <List
            size="small"
            dataSource={abnormalOrders.slice(0, 8)}
            renderItem={({ order, type, hoursStuck }) => (
              <List.Item
                style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}
                actions={[
                  <Button
                    key="go"
                    type="link"
                    size="small"
                    icon={<RightOutlined />}
                    onClick={() => navigate('/orders')}
                  >
                    推进节点
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge status="error" />
                  }
                  title={
                    <Space>
                      <Text strong>#{order.orderNo}</Text>
                      <Tag 
                        color={
                          type === '已派单未出发' ? 'orange' : 
                          type === '司机未到店' ? 'red' : 'volcano'
                        } 
                        icon={<StopOutlined />}
                        style={{ margin: 0 }}
                      >
                        {type}
                      </Tag>
                      <Text type="danger" style={{ fontSize: 12 }}>
                        已停滞约 {hoursStuck} 小时
                      </Text>
                    </Space>
                  }
                  description={
                    <Space orientation="vertical" size={2}>
                      <Space size={16}>
                        <Text type="secondary">
                          <ShopOutlined /> {order.storeName}
                        </Text>
                        <Text type="secondary">
                          👤 {order.driverName || '未指派'}
                        </Text>
                        <Text type="secondary">
                          ⏰ {dayjs(order.departureTime).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        当前节点：{order.currentStep || order.status}
                        {order.driverName && ` · 司机：${order.driverName}`}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

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
