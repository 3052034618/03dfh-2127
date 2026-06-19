import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { Driver, DriverTag } from '../types';

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
  const { drivers, fleets, stores, getEvaluationsByDriver, addDriver, updateDriver } = useApp();
  const [searchText, setSearchText] = useState('');
  const [filterTag, setFilterTag] = useState<DriverTag | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
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
        style={{ width: 320 }}
        renderItem={item => (
          <List.Item style={{ padding: '8px 0' }}>
            <List.Item.Meta
              avatar={<StarOutlined style={{ color: '#faad14' }} />}
              title={
                <Space>
                  <Text strong>{item.createdAt}</Text>
                  <Rate disabled allowHalf value={(item.punctuality + item.service + item.route) / 3} style={{ fontSize: 12 }} />
                </Space>
              }
              description={
                <Space orientation="vertical" size={4}>
                  <Text type="secondary">{item.feedback}</Text>
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
          <Tooltip title="查看评价">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

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
    </div>
  );
};

export default DriverManagement;
