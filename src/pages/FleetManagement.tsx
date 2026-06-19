import React, { useState } from 'react';
import { Table, Card, Tag, Space, Typography, Button, Avatar, Row, Col, Modal, Form, Input, Select, message } from 'antd';
import { TeamOutlined, PhoneOutlined, StarOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { Fleet } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const FleetManagement: React.FC = () => {
  const { fleets, drivers, updateFleet } = useApp();
  const [editVisible, setEditVisible] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  const [form] = Form.useForm();

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = { 'A级': 'gold', 'B级': 'blue', 'C级': 'green' };
    return map[level] || 'default';
  };

  const getDriverCount = (fleetId: string) => drivers.filter(d => d.fleetId === fleetId).length;

  const handleEdit = (fleet: Fleet) => {
    setEditingFleet(fleet);
    form.setFieldsValue(fleet);
    setEditVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingFleet) {
        updateFleet(editingFleet.id, values);
        message.success('车队信息已更新');
        setEditVisible(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      title: '车队名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => (
        <Space>
          <Avatar style={{ backgroundColor: '#722ed1', verticalAlign: 'middle' }} icon={<TeamOutlined />} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '合作等级',
      dataIndex: 'cooperationLevel',
      key: 'cooperationLevel',
      width: 100,
      render: (level: string) => (
        <Tag icon={<StarOutlined />} color={getLevelColor(level)} style={{ fontSize: 14, padding: '2px 10px' }}>
          {level}
        </Tag>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      width: 120,
      render: (contact: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {contact}
        </Space>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <a href={`tel:${phone}`}>{phone}</a>
        </Space>
      ),
    },
    {
      title: '注册司机数',
      dataIndex: 'driverCount',
      key: 'driverCount',
      width: 120,
      render: (val: number, record: { id: string }) => {
        const active = getDriverCount(record.id);
        return (
          <Space>
            <Text strong style={{ fontSize: 16, color: '#1677ff' }}>{active}</Text>
            <Text type="secondary">/ {val}人</Text>
          </Space>
        );
      },
    },
    {
      title: '在库司机人数',
      key: 'activeCount',
      width: 140,
      render: (_: unknown, record: { id: string }) => {
        const count = getDriverCount(record.id);
        return <Tag color="blue">{count} 位在库</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Fleet) => (
        <Space>
          <Button type="link" size="small">查看详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>车队管理</Title>
      <Text type="secondary">管理合作车队信息，维护联系人与合作等级</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">合作车队总数</Text>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{fleets.length}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">A级合作车队</Text>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#faad14', marginTop: 4 }}>
              {fleets.filter(f => f.cooperationLevel === 'A级').length}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">车队司机总数</Text>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#1677ff', marginTop: 4 }}>
              {fleets.reduce((sum, f) => sum + f.driverCount, 0)}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">在库司机数</Text>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a', marginTop: 4 }}>{drivers.length}</div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} size="small">
        <Table
          dataSource={fleets}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个车队` }}
        />
      </Card>

      <Modal
        title="编辑车队信息"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="车队名称" rules={[{ required: true, message: '请输入车队名称' }]}>
            <Input placeholder="请输入车队名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="cooperationLevel" label="合作等级" rules={[{ required: true, message: '请选择合作等级' }]}>
            <Select placeholder="选择合作等级">
              <Option value="A级">A级 - 核心合作</Option>
              <Option value="B级">B级 - 优质合作</Option>
              <Option value="C级">C级 - 普通合作</Option>
            </Select>
          </Form.Item>
          <Form.Item name="driverCount" label="注册司机数">
            <Input type="number" placeholder="车队注册司机总人数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FleetManagement;
