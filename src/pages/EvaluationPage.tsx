import React, { useState } from 'react';
import { Table, Card, Tag, Space, Typography, Rate, Avatar, Select, Input, List, Row, Col } from 'antd';
import { UserOutlined, SearchOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import type { DriverTag } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

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

const EvaluationPage: React.FC = () => {
  const { evaluations, drivers, orders } = useApp();
  const [searchText, setSearchText] = useState('');
  const [filterDriver, setFilterDriver] = useState<string>();
  const [filterTag, setFilterTag] = useState<DriverTag>();

  const filteredEvaluations = evaluations.filter(e => {
    if (searchText && !e.feedback.includes(searchText) && !e.driverName.includes(searchText)) {
      return false;
    }
    if (filterDriver && e.driverId !== filterDriver) return false;
    if (filterTag && !e.tags.includes(filterTag)) return false;
    return true;
  });

  const getAvgScore = () => {
    if (evaluations.length === 0) return 0;
    const total = evaluations.reduce((sum, e) => sum + (e.punctuality + e.service + e.route) / 3, 0);
    return total / evaluations.length;
  };

  const tagStats = () => {
    const stats: Record<string, number> = {};
    evaluations.forEach(e => {
      e.tags.forEach(t => {
        stats[t] = (stats[t] || 0) + 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  const driverRanking = () => {
    const map: Record<string, { name: string; total: number; avgScore: number }> = {};
    evaluations.forEach(e => {
      if (!map[e.driverId]) {
        map[e.driverId] = { name: e.driverName, total: 0, avgScore: 0 };
      }
      map[e.driverId].total += 1;
      map[e.driverId].avgScore += (e.punctuality + e.service + e.route) / 3;
    });
    return Object.entries(map).map(([id, data]) => ({
      id,
      ...data,
      avgScore: data.avgScore / data.total,
    })).sort((a, b) => b.avgScore - a.avgScore);
  };

  const columns = [
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#999' }} />
          <span>{val}</span>
        </Space>
      ),
    },
    {
      title: '司机',
      key: 'driver',
      width: 160,
      render: (_: unknown, record: typeof evaluations[0]) => {
        const driver = drivers.find(d => d.id === record.driverId);
        return (
          <Space>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
              {record.driverName.charAt(0)}
            </Avatar>
            <Space orientation="vertical" size={0}>
              <Text strong>{record.driverName}</Text>
              {driver && <Text type="secondary" style={{ fontSize: 12 }}>{driver.fleetName || '个体司机'}</Text>}
            </Space>
          </Space>
        );
      },
    },
    {
      title: '对应订单',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (val?: string) => val ? (
        <Tag color="blue">#{val}</Tag>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: '综合评分',
      key: 'score',
      width: 220,
      render: (_: unknown, record: typeof evaluations[0]) => {
        const avg = (record.punctuality + record.service + record.route) / 3;
        return (
          <Space orientation="vertical" size={2}>
            <Space>
              <Rate disabled allowHalf value={avg} style={{ fontSize: 16 }} />
              <Text strong style={{ color: '#faad14', fontSize: 16 }}>{avg.toFixed(1)}</Text>
            </Space>
            <Space size={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>准时 {record.punctuality}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>服务 {record.service}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>路线 {record.route}</Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: '反馈内容',
      dataIndex: 'feedback',
      key: 'feedback',
      ellipsis: true,
      render: (val: string) => (
        <Space>
          <MessageOutlined style={{ color: '#999' }} />
          <span>{val}</span>
        </Space>
      ),
    },
    {
      title: '服务标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: DriverTag[]) => (
        <Space wrap size={4}>
          {tags.map(t => (
            <Tag key={t} color={tagColorMap[t]} style={{ margin: 2 }}>{t}</Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>服务评价中心</Title>
      <Text type="secondary">沉淀司机服务评价数据，为下一次派单推荐提供依据</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">评价总数</Text>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#1677ff' }}>
              {evaluations.length}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">综合平均分</Text>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#faad14' }}>
              <Rate disabled allowHalf value={getAvgScore()} style={{ fontSize: 14 }} />
              <span style={{ marginLeft: 8 }}>{getAvgScore().toFixed(2)}</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">被评司机数</Text>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#52c41a' }}>
              {new Set(evaluations.map(e => e.driverId)).size}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Text type="secondary">累计服务订单</Text>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#722ed1' }}>
              {orders.filter(o => o.status === '已完成').length}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title="司机口碑榜" size="small">
            <List
              dataSource={driverRanking()}
              renderItem={(item, index) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#8c8c8c' : index === 2 ? '#d48806' : '#1677ff',
                          verticalAlign: 'middle',
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        <Rate disabled allowHalf value={item.avgScore} style={{ fontSize: 12 }} />
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.total} 条评价 · 平均分 {item.avgScore.toFixed(2)}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="热门服务标签" size="small">
            <Space wrap size={[8, 8]} style={{ padding: '8px 0' }}>
              {tagStats().map(([tag, count]) => (
                <Tag
                  key={tag}
                  color={tagColorMap[tag as DriverTag]}
                  style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}
                >
                  {tag} <Text strong>{count}</Text>
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="评分分布" size="small">
            <Space orientation="vertical" size="middle" style={{ width: '100%', padding: '8px 0' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = evaluations.filter(e => {
                  const avg = (e.punctuality + e.service + e.route) / 3;
                  return Math.round(avg) === star;
                }).length;
                const percent = evaluations.length === 0 ? 0 : (count / evaluations.length) * 100;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ width: 60 }}>{star} 星</Text>
                    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: star >= 4 ? '#52c41a' : star === 3 ? '#faad14' : '#ff4d4f',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <Text type="secondary" style={{ width: 40, textAlign: 'right' }}>{count}条</Text>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} size="small">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索司机姓名/反馈内容"
            style={{ width: 240 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="按司机筛选"
            style={{ width: 180 }}
            value={filterDriver}
            onChange={setFilterDriver}
            allowClear
          >
            {drivers.map(d => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="按标签筛选"
            style={{ width: 140 }}
            value={filterTag}
            onChange={(val: DriverTag) => setFilterTag(val)}
            allowClear
          >
            {Object.keys(tagColorMap).map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Space>
        <Table
          dataSource={filteredEvaluations}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条评价` }}
        />
      </Card>
    </div>
  );
};

export default EvaluationPage;
