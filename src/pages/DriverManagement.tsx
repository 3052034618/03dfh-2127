import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Avatar,
  Rate,
  Typography,
  Popover,
  List,
  Tooltip,
  Row,
  Col,
  Card,
  message,
  Progress,
  Divider,
  Timeline,
  Descriptions,
  Badge,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PhoneOutlined,
  UserOutlined,
  StarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  MoonOutlined,
  ShopOutlined,
  EditOutlined,
  EyeOutlined,
  RiseOutlined,
  HistoryOutlined,
  TrophyOutlined,
  LikeOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { Driver, DriverTag } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const allTags: DriverTag[] = ['好约', '准时', '绕路少', '适合大车', '夜间活跃', '服务好', '熟悉路线', '价格公道'];

const tagColorMap: Record<DriverTag, string> = {
  '好约': 'green',
  '准时': 'blue',
  '绕路少': 'cyan',
  '适合大车': 'purple',
  '夜间活跃': 'magenta',
  '服务好': 'gold',
  '熟悉路线': 'geekblue',
  '价格公道': 'lime',
};

const DriverManagement: React.FC = () => {
  const { drivers, fleets, stores, orders, getEvaluationsByDriver, addDriver, updateDriver } = useApp();
  const [searchText, setSearchText] = useState('');
  const [filterTag, setFilterTag] = useState<DriverTag | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [form] = Form.useForm();

  const filteredDrivers = drivers.filter(d => {
    if (searchText && !d.name.includes(searchText) && !d.phone.includes(searchText) && !d.plateNumber.includes(searchText)) {
      return false;
    }
    if (filterTag && !d.tags.includes(filterTag)) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  const handleAdd = () => {
    setEditingDriver(null);
    form.resetFields();
    form.setFieldsValue({
      nightService: false,
      status: '在岗',
    });
    setModalVisible(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    form.setFieldsValue({
      ...driver,
    });
    setModalVisible(true);
  };

  const handleViewDetail = (driver: Driver) => {
    setDetailDriver(driver);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const fleet = fleets.find(f => f.id === values.fleetId);
      
      if (editingDriver) {
        updateDriver(editingDriver.id, {
          ...values,
          fleetName: fleet?.name,
        });
        message.success('司机信息已更新');
      } else {
        const newDriver: Driver = {
          id: `d${Date.now()}`,
          name: values.name,
          phone: values.phone,
          fleetId: values.fleetId,
          fleetName: fleet?.name,
          carType: values.carType,
          carCapacity: Number(values.carCapacity),
          plateNumber: values.plateNumber,
          serviceAreas: values.serviceAreas || [],
          nightService: values.nightService,
          usualStores: values.usualStores || [],
          tags: values.tags || [],
          rating: 5.0,
          totalOrders: 0,
          status: values.status,
        };
        addDriver(newDriver);
        message.success('司机添加成功');
      }
      setModalVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderEvaluationPopover = (driver: Driver) => {
    const evals = getEvaluationsByDriver(driver.id).slice(0, 3);
    if (evals.length === 0) {
      return <Text type="secondary">暂无评价</Text>;
    }
    return (
      <List
        size="small"
        dataSource={evals}
        style={{ width: 380 }}
        renderItem={item => (
          <List.Item style={{ padding: '10px 0' }}>
            <List.Item.Meta
              avatar={<StarOutlined style={{ color: '#faad14' }} />}
              title={
                <Space orientation="vertical" size={2}>
                  <Space>
                    {item.orderNo && <Tag color="blue" style={{ margin: 0 }}>#{item.orderNo}</Tag>}
                    <Text strong type="secondary" style={{ fontSize: 12 }}>{item.createdAt}</Text>
                  </Space>
                </Space>
              }
              description={
                <Space orientation="vertical" size={6}>
                  <Space>
                    <Rate disabled allowHalf value={(item.punctuality + item.service + item.route) / 3} style={{ fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 11 }}>准时 {item.punctuality} · 服务 {item.service} · 路线 {item.route}</Text>
                  </Space>
                  <Text style={{ fontSize: 13 }}>💬 {item.feedback}</Text>
                  <Space wrap>
                    {item.tags.map(t => (
                      <Tag key={t} color={tagColorMap[t]} style={{ margin: 0 }}>{t}</Tag>
                    ))}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const columns = [
    {
      title: '司机信息',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Driver) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
            {name.charAt(0)}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Text strong>{name}</Text>
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 12, color: '#999' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
            </Space>
          </Space>
        </Space>
      ),
    },
    {
      title: '车辆信息',
      key: 'car',
      width: 180,
      render: (_: unknown, record: Driver) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <CarOutlined style={{ color: '#666' }} />
            <Text strong>{record.carType}</Text>
            <Tag color="blue">{record.carCapacity}座</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.plateNumber}</Text>
        </Space>
      ),
    },
    {
      title: '所属车队',
      dataIndex: 'fleetName',
      key: 'fleetName',
      width: 120,
      render: (val?: string) => val ? <Tag color="geekblue">{val}</Tag> : <Text type="secondary">个体</Text>,
    },
    {
      title: '服务区域',
      dataIndex: 'serviceAreas',
      key: 'serviceAreas',
      width: 180,
      render: (areas: string[]) => (
        <Space wrap size={4}>
          {areas.map(a => (
            <Tag key={a} icon={<EnvironmentOutlined />} color="cyan" style={{ margin: 2 }}>{a}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '常跑门店',
      dataIndex: 'usualStores',
      key: 'usualStores',
      width: 160,
      render: (storeIds: string[]) => (
        <Space wrap size={4}>
          {storeIds.map(sid => {
            const store = stores.find(s => s.id === sid);
            return store ? (
              <Tag key={sid} icon={<ShopOutlined />} color="purple" style={{ margin: 2 }}>
                {store.name.replace('迷雾剧社·', '').replace('店', '')}
              </Tag>
            ) : null;
          })}
        </Space>
      ),
    },
    {
      title: '服务标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 240,
      render: (tags: DriverTag[]) => (
        <Space wrap size={4}>
          {tags.map(t => (
            <Tag key={t} color={tagColorMap[t]} style={{ margin: 2 }}>{t}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '夜间',
      dataIndex: 'nightService',
      key: 'nightService',
      width: 70,
      align: 'center' as const,
      render: (val: boolean) => val 
        ? <Tag icon={<MoonOutlined />} color="magenta">接单</Tag> 
        : <Text type="secondary">—</Text>,
    },
    {
      title: '评分/接单',
      key: 'rating',
      width: 140,
      render: (_: unknown, record: Driver) => (
        <Space orientation="vertical" size={2}>
          <Popover content={renderEvaluationPopover(record)} title="最近服务评价" trigger="click">
            <Space>
              <Rate disabled allowHalf value={record.rating} style={{ fontSize: 14 }} />
              <Text strong style={{ color: '#faad14' }}>{record.rating}</Text>
            </Space>
          </Popover>
          <Text type="secondary" style={{ fontSize: 12 }}>累计 {record.totalOrders} 单</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = { '在岗': 'green', '出车中': 'blue', '休息': 'default' };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: Driver) => (
        <Space>
          <Tooltip title="查看司机档案">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              详情
            </Button>
          </Tooltip>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const detailData = useMemo(() => {
    if (!detailDriver) return null;
    const evals = getEvaluationsByDriver(detailDriver.id);
    const driverOrders = orders.filter(o => o.driverId === detailDriver.id).sort((a, b) => 
      dayjs(b.departureTime).valueOf() - dayjs(a.departureTime).valueOf()
    );
    
    const tagStats: Record<string, number> = {};
    evals.forEach(e => e.tags.forEach(t => {
      tagStats[t] = (tagStats[t] || 0) + 1;
    }));
    detailDriver.tags.forEach(t => {
      if (!tagStats[t]) tagStats[t] = 1;
    });
    
    const sortedTagStats = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);
    
    const ratingTrend = evals.slice(0, 10).reverse().map(e => ({
      date: dayjs(e.createdAt).format('MM-DD'),
      score: Math.round(((e.punctuality + e.service + e.route) / 3) * 100) / 100,
      orderNo: e.orderNo,
    }));
    
    const avgScore = evals.length > 0 
      ? evals.reduce((s, e) => s + (e.punctuality + e.service + e.route) / 3, 0) / evals.length
      : 0;
    
    return { evals, driverOrders, sortedTagStats, ratingTrend, avgScore };
  }, [detailDriver, orders, getEvaluationsByDriver]);

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>车源库管理</Title>
      <Text type="secondary">维护合作司机、车队联系人、服务区域和服务标签</Text>

      <Card style={{ marginTop: 16 }} size="small">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索司机姓名/电话/车牌"
            style={{ width: 240 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="按标签筛选"
            style={{ width: 140 }}
            value={filterTag}
            onChange={setFilterTag}
            allowClear
          >
            {allTags.map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
          <Select
            placeholder="按状态筛选"
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
          >
            <Option value="在岗">在岗</Option>
            <Option value="出车中">出车中</Option>
            <Option value="休息">休息</Option>
          </Select>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增司机
          </Button>
        </Space>
      </Card>

      <Table
        style={{ marginTop: 16 }}
        dataSource={filteredDrivers}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 位司机` }}
      />

      <Modal
        title={editingDriver ? '编辑司机信息' : '新增司机'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="司机姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fleetId" label="所属车队">
                <Select placeholder="选择车队" allowClear>
                  {fleets.map(f => (
                    <Option key={f.id} value={f.id}>{f.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="当前状态" rules={[{ required: true }]}>
                <Select>
                  <Option value="在岗">在岗</Option>
                  <Option value="出车中">出车中</Option>
                  <Option value="休息">休息</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="carType" label="车型" rules={[{ required: true }]}>
                <Input placeholder="如：19座考斯特" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="carCapacity" label="座位数" rules={[{ required: true }]}>
                <Input type="number" placeholder="请输入座位数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plateNumber" label="车牌号" rules={[{ required: true }]}>
                <Input placeholder="如：京A·12345" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nightService" label="夜间接单" rules={[{ required: true }]}>
                <Select>
                  <Option value={true}>夜间可接单</Option>
                  <Option value={false}>仅白天</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="serviceAreas" label="服务区域" rules={[{ required: true }]}>
                <Select mode="multiple" placeholder="选择可服务的区域">
                  {['朝阳区', '海淀区', '西城区', '东城区', '丰台区'].map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="usualStores" label="常跑门店">
                <Select mode="multiple" placeholder="选择常服务的门店">
                  {stores.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="tags" label="服务标签">
                <Select mode="multiple" placeholder="选择服务标签">
                  {allTags.map(t => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {detailDriver && detailData && (
        <Modal
          title={
            <Space>
              <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
                {detailDriver.name.charAt(0)}
              </Avatar>
              <Space orientation="vertical" size={0}>
                <Text strong style={{ fontSize: 16 }}>{detailDriver.name}</Text>
                <Space>
                  <Tag color={detailDriver.status === '在岗' ? 'green' : detailDriver.status === '出车中' ? 'blue' : 'default'}>
                    {detailDriver.status}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <PhoneOutlined /> {detailDriver.phone}
                  </Text>
                </Space>
              </Space>
            </Space>
          }
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={
            <Space>
              <Button onClick={() => { handleEdit(detailDriver); setDetailVisible(false); }}>
                编辑资料
              </Button>
              <Button type="primary" onClick={() => setDetailVisible(false)}>
                关闭
              </Button>
            </Space>
          }
          width={880}
          maskClosable={false}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="综合评分"
                  value={detailDriver.rating.toFixed(2)}
                  prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                  styles={{ content: { color: '#faad14', fontSize: 28 } }}
                />
                <Rate disabled allowHalf value={detailDriver.rating} style={{ fontSize: 14 }} />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    累计接单 {detailDriver.totalOrders} 单 · 评价 {detailData.evals.length} 条
                  </Text>
                </div>
              </Card>
              
              <Card 
                size="small" 
                style={{ marginTop: 12 }} 
                title={<span><CarOutlined /> 车辆信息</span>}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="车型">{detailDriver.carType}</Descriptions.Item>
                  <Descriptions.Item label="座位"><Tag color="blue">{detailDriver.carCapacity}座</Tag></Descriptions.Item>
                  <Descriptions.Item label="车牌">{detailDriver.plateNumber}</Descriptions.Item>
                  <Descriptions.Item label="车队">
                    {detailDriver.fleetName ? <Tag color="geekblue">{detailDriver.fleetName}</Tag> : '个体'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card 
                size="small" 
                style={{ marginTop: 12 }} 
                title={<span><RiseOutlined /> 最近评分走势</span>}
              >
                {detailData.ratingTrend.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>暂无历史评分</Text>
                ) : (
                  <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                    {detailData.ratingTrend.map((t, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Space>
                            <Text type="secondary" style={{ fontSize: 11 }}>{t.date}</Text>
                            {t.orderNo && <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px', height: 16 }}>#{t.orderNo}</Tag>}
                          </Space>
                          <Text strong style={{ fontSize: 11, color: t.score >= 4.5 ? '#52c41a' : t.score >= 3.5 ? '#faad14' : '#ff4d4f' }}>
                            {t.score}
                          </Text>
                        </div>
                        <Progress 
                          percent={(t.score / 5) * 100} 
                          showInfo={false} 
                          size="small"
                          strokeColor={t.score >= 4.5 ? '#52c41a' : t.score >= 3.5 ? '#faad14' : '#ff4d4f'}
                        />
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>

            <Col span={16}>
              <Card size="small" title={<span><LikeOutlined /> 服务标签沉淀</span>}>
                <Space wrap>
                  {detailData.sortedTagStats.length === 0 ? (
                    <Text type="secondary">暂无服务标签</Text>
                  ) : detailData.sortedTagStats.map(([tag, count]) => (
                    <Badge key={tag} count={count} size="small" offset={[4, -2]}>
                      <Tag color={tagColorMap[tag as DriverTag] || 'default'} style={{ fontSize: 13, margin: 4, padding: '4px 10px' }}>
                        {tag}
                      </Tag>
                    </Badge>
                  ))}
                </Space>
                <Divider style={{ margin: '12px 0' }} />
                <Space wrap size={[8, 8]}>
                  <Tag icon={<EnvironmentOutlined />} color="cyan">
                    服务区域：{detailDriver.serviceAreas.join('、')}
                  </Tag>
                  <Tag icon={<MoonOutlined />} color={detailDriver.nightService ? 'magenta' : 'default'}>
                    夜间：{detailDriver.nightService ? '可接单' : '仅白天'}
                  </Tag>
                  {detailDriver.usualStores.map(sid => {
                    const store = stores.find(s => s.id === sid);
                    return store ? (
                      <Tag key={sid} icon={<ShopOutlined />} color="purple">
                        常跑：{store.name.replace('迷雾剧社·', '')}
                      </Tag>
                    ) : null;
                  })}
                </Space>
              </Card>

              <Card 
                size="small" 
                style={{ marginTop: 12 }} 
                title={<span><HistoryOutlined /> 服务历史与评价时间线</span>}
                bodyStyle={{ maxHeight: 420, overflowY: 'auto' }}
              >
                {detailData.evals.length === 0 && detailData.driverOrders.length === 0 ? (
                  <Empty description="暂无服务记录" />
                ) : (
                  <Timeline
                    mode="left"
                    items={[
                      ...detailData.evals.map(e => ({
                        color: 'green',
                        dot: <StarOutlined style={{ color: '#faad14' }} />,
                        label: <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(e.createdAt).format('YYYY-MM-DD HH:mm')}</Text>,
                        children: (
                          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                              <Tag color="blue" style={{ margin: 0 }}>订单 #{e.orderNo}</Tag>
                              <Badge count={Math.round(((e.punctuality + e.service + e.route) / 3) * 10) / 10} showZero color="#faad14" />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                准时 {e.punctuality} · 服务 {e.service} · 路线 {e.route}
                              </Text>
                            </Space>
                            <Text>💬 {e.feedback}</Text>
                            {e.tags.length > 0 && (
                              <Space wrap>
                                {e.tags.map(t => (
                                  <Tag key={t} color={tagColorMap[t]} style={{ margin: 0 }}>{t}</Tag>
                                ))}
                              </Space>
                            )}
                          </Space>
                        ),
                      })),
                      ...detailData.driverOrders
                        .filter(o => !detailData.evals.some(e => e.orderId === o.id))
                        .map(o => ({
                          color: 'blue',
                          dot: <FieldTimeOutlined style={{ color: '#1677ff' }} />,
                          label: <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(o.departureTime).format('YYYY-MM-DD HH:mm')}</Text>,
                          children: (
                            <Space orientation="vertical" size={2}>
                              <Space>
                                <Tag color="blue" style={{ margin: 0 }}>订单 #{o.orderNo}</Tag>
                                <Tag color={o.status === '已完成' ? 'green' : o.status === '服务中' ? 'processing' : 'blue'}>{o.status}</Tag>
                              </Space>
                              <Text type="secondary">{o.storeName} · {o.peopleCount}人 · 预算 ¥{o.budget}</Text>
                              {o.actualArrivalTime && <Text type="secondary">实际到店：{o.actualArrivalTime}</Text>}
                              {o.playerFeedback && <Text>💬 {o.playerFeedback}</Text>}
                              <Text type="secondary" style={{ fontSize: 11 }}>（待补录评价）</Text>
                            </Space>
                          ),
                        })),
                    ]}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </Modal>
      )}
    </div>
  );
};

export default DriverManagement;
