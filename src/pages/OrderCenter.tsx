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
  DatePicker,
  Typography,
  Card,
  Avatar,
  Rate,
  InputNumber,
  Radio,
  Tooltip,
  List,
  Popover,
  message,
  Row,
  Col,
  Badge,
  Steps,
  Collapse,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  CarOutlined,
  EnvironmentOutlined,
  MoonOutlined,
  ShopOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  EditOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useApp, SERVICE_STEPS } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import type { CarOrder, Driver, DriverTag } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const allPriorityTags: DriverTag[] = ['好约', '准时', '绕路少', '适合大车', '夜间活跃', '服务好', '熟悉路线', '价格公道'];

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

const OrderCenter: React.FC = () => {
  const { orders, stores, drivers, fleets, getDriversByFilter, addOrder, updateOrder, getEvaluationsByDriver, addEvaluation, updateDriver, assignDriverToOrder, advanceOrderStep } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>();
  const [publishVisible, setPublishVisible] = useState(false);
  const [recommendVisible, setRecommendVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [scheduleDriver, setScheduleDriver] = useState<Driver | null>(null);
  const [currentOrder, setCurrentOrder] = useState<CarOrder | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [publishForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();

  const urlFilter = searchParams.get('filter');
  const urlType = searchParams.get('type');
  const urlOrderNo = searchParams.get('orderNo');

  const isAbnormalOrder = (o: CarOrder): { abnormal: boolean; type: string; hours: number } => {
    let abnormal = false;
    let type = '';
    let hours = 0;
    const step = o.currentStep;
    const refTime = step ? o.stepTimestamps?.[step] : undefined;
    const baseTime = refTime || o.departureTime;
    hours = Math.max(0, dayjs().diff(dayjs(baseTime), 'hour'));
    
    if (o.status === '已派单') {
      if (!step || step === '已派单') {
        if (hours >= 1) { abnormal = true; type = '已派单未出发'; }
      } else if (step === '司机已出发') {
        if (hours >= 2) { abnormal = true; type = '司机未到店'; }
      }
    } else if (o.status === '服务中') {
      if (step === '司机已出发' || !step) {
        if (hours >= 2) { abnormal = true; type = '司机未到店'; }
      } else if (step === '已到店' || step === '已接到玩家') {
        if (hours >= 4) { abnormal = true; type = '服务中未完成'; }
      }
    }
    return { abnormal, type, hours };
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchText && !o.orderNo.includes(searchText) && !o.storeName.includes(searchText)) {
        return false;
      }
      if (filterStatus && o.status !== filterStatus) return false;
      if (urlFilter === 'abnormal') {
        const { abnormal, type } = isAbnormalOrder(o);
        if (!abnormal) return false;
        if (urlType && type !== urlType) return false;
      }
      if (urlOrderNo && !o.orderNo.includes(urlOrderNo)) return false;
      return true;
    });
  }, [orders, searchText, filterStatus, urlFilter, urlType, urlOrderNo]);

  const clearUrlFilter = () => {
    setSearchParams({});
  };

  const getDriverSchedule = (driver: Driver, targetDate?: dayjs.Dayjs) => {
    const date = targetDate || (currentOrder ? dayjs(currentOrder.departureTime) : dayjs());
    const driverOrders = orders.filter(o => 
      o.driverId === driver.id &&
      dayjs(o.departureTime).isSame(date, 'day') &&
      o.status !== '待确认'
    );

    const events = driverOrders.map(o => ({
      orderId: o.id,
      orderNo: o.orderNo,
      start: dayjs(o.departureTime),
      end: dayjs(o.endTime),
      status: o.status,
      currentStep: o.currentStep,
      storeName: o.storeName,
      peopleCount: o.peopleCount,
    })).sort((a, b) => a.start.valueOf() - b.start.valueOf());

    const startHour = 8;
    const endHour = 24;
    const totalHours = endHour - startHour;

    const blocks: Array<{
      type: 'idle' | 'dispatched' | 'inservice' | 'completed';
      start: number;
      end: number;
      orderNo?: string;
      storeName?: string;
    }> = [];

    let lastEnd = startHour;
    events.forEach(ev => {
      const evStart = ev.start.hour() + ev.start.minute() / 60;
      const evEnd = ev.end.hour() + ev.end.minute() / 60;
      
      if (evStart > lastEnd) {
        blocks.push({ type: 'idle', start: lastEnd, end: evStart });
      }
      
      const type = ev.status === '已完成' ? 'completed' :
                   ev.status === '服务中' ? 'inservice' : 'dispatched';
      blocks.push({
        type,
        start: Math.max(startHour, evStart),
        end: Math.min(endHour, evEnd),
        orderNo: ev.orderNo,
        storeName: ev.storeName,
      });
      lastEnd = Math.max(lastEnd, evEnd);
    });
    
    if (lastEnd < endHour) {
      blocks.push({ type: 'idle', start: lastEnd, end: endHour });
    }

    return { date, events, blocks, totalHours, startHour, endHour };
  };

  const renderScheduleBar = (driver: Driver) => {
    const sched = getDriverSchedule(driver);
    if (!currentOrder) return null;

    const targetStart = dayjs(currentOrder.departureTime).hour() + dayjs(currentOrder.departureTime).minute() / 60;
    const targetEnd = dayjs(currentOrder.endTime).hour() + dayjs(currentOrder.endTime).minute() / 60;
    const hasConflict = sched.events.some(ev => 
      dayjs(currentOrder.departureTime).isBefore(ev.end) &&
      dayjs(currentOrder.endTime).isAfter(ev.start)
    );

    const idleBlocks = sched.blocks.filter(b => b.type === 'idle');
    const canFit = idleBlocks.some(b => 
      b.start <= targetStart && b.end >= targetEnd
    );

    return (
      <div style={{ marginTop: 8 }}>
        <Space size={4} style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            当日日程：
          </Text>
          {hasConflict ? (
            <Tag color="error" style={{ margin: 0, fontSize: 11 }}>⏰ 时间冲突</Tag>
          ) : canFit ? (
            <Tag color="success" style={{ margin: 0, fontSize: 11 }}>✅ 时段空闲</Tag>
          ) : (
            <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>⚠️ 时段紧张</Tag>
          )}
        </Space>
        <div 
          style={{ 
            position: 'relative', 
            height: 28, 
            background: '#f5f5f5', 
            borderRadius: 4, 
            overflow: 'hidden',
            border: '1px solid #e8e8e8',
          }}
        >
          {sched.blocks.map((block, idx) => {
            const left = ((block.start - sched.startHour) / sched.totalHours) * 100;
            const width = ((block.end - block.start) / sched.totalHours) * 100;
            const bgColor = block.type === 'idle' ? '#52c41a' :
                          block.type === 'inservice' ? '#13c2c2' :
                          block.type === 'completed' ? '#8c8c8c' : '#1677ff';
            return (
              <Tooltip 
                key={idx}
                title={
                  block.type === 'idle' 
                    ? `空闲：${Math.floor(block.start)}:${String(Math.round((block.start%1)*60)).padStart(2,'0')} - ${Math.floor(block.end)}:${String(Math.round((block.end%1)*60)).padStart(2,'0')}`
                    : `订单 #${block.orderNo} · ${block.storeName}`
                }
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    height: '100%',
                    background: bgColor,
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            );
          })}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${((targetStart - sched.startHour) / sched.totalHours) * 100}%`,
              width: `${((targetEnd - targetStart) / sched.totalHours) * 100}%`,
              border: '2px dashed #faad14',
              borderRadius: 4,
              boxSizing: 'border-box',
              pointerEvents: 'none',
              background: hasConflict ? 'rgba(255,77,79,0.1)' : 'rgba(82,196,26,0.1)',
            }}
          />
          <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 9, color: '#999' }}>
                {sched.startHour + i * 4}:00
              </Text>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleViewSchedule = (driver: Driver) => {
    setScheduleDriver(driver);
    setScheduleVisible(true);
  };

  const isNightTime = (timeStr: string) => {
    const hour = dayjs(timeStr).hour();
    return hour >= 22 || hour < 6;
  };

  const recommendedDrivers = useMemo(() => {
    if (!currentOrder) return [];
    const isNight = isNightTime(currentOrder.endTime);
    return getDriversByFilter(currentOrder.storeId, isNight, currentOrder.peopleCount, currentOrder.priorityTags);
  }, [currentOrder, getDriversByFilter]);

  const filteredOutDrivers = useMemo(() => {
    if (!currentOrder) return [];
    const isNight = isNightTime(currentOrder.endTime);
    const recIds = new Set(recommendedDrivers.map(d => d.id));
    return drivers
      .filter(d => !recIds.has(d.id))
      .map(driver => {
        const reasons: string[] = [];
        if (driver.status === '休息') reasons.push('🛌 司机已标记休息');
        const store = stores.find(s => s.id === currentOrder.storeId);
        const inArea = driver.usualStores.includes(currentOrder.storeId) || 
          (store && driver.serviceAreas.includes(store.district));
        if (!inArea) reasons.push('📍 不在门店服务区域');
        if (isNight && !driver.nightService) reasons.push('🌙 不接夜单');
        if (driver.carCapacity < currentOrder.peopleCount) {
          reasons.push(`⚠️ 座位不够：仅${driver.carCapacity}座，需要${currentOrder.peopleCount}座`);
        }
        if (currentOrder.priorityTags && currentOrder.priorityTags.length > 0) {
          const hasMatch = currentOrder.priorityTags.some(t => driver.tags.includes(t));
          if (!hasMatch) reasons.push(`🏷️ 缺少优先级标签：${currentOrder.priorityTags.join('、')}`);
        }
        const depStart = dayjs(currentOrder.departureTime);
        const depEnd = dayjs(currentOrder.endTime);
        const conflict = orders.find(o => 
          o.id !== currentOrder.id &&
          o.driverId === driver.id &&
          o.status !== '已完成' &&
          o.status !== '待确认' &&
          dayjs(o.departureTime).isBefore(depEnd) &&
          dayjs(o.endTime).isAfter(depStart)
        );
        if (conflict) {
          reasons.push(`⏰ 时间冲突：与订单 #${conflict.orderNo} 重叠`);
        }
        return { driver, reasons };
      })
      .filter(x => x.reasons.length > 0)
      .slice(0, 8);
  }, [currentOrder, recommendedDrivers, drivers, stores, orders]);

  const handlePublish = () => {
    publishForm.resetFields();
    setPublishVisible(true);
  };

  const handlePublishSubmit = async () => {
    try {
      const values = await publishForm.validateFields();
      const [start, end] = values.timeRange;
      const newOrder: CarOrder = {
        id: `o${Date.now()}`,
        orderNo: `CY${dayjs().format('YYYYMMDD')}${String(orders.length + 1).padStart(3, '0')}`,
        storeId: values.storeId,
        storeName: stores.find(s => s.id === values.storeId)?.name || '',
        departureTime: start.format('YYYY-MM-DD HH:mm'),
        endTime: end.format('YYYY-MM-DD HH:mm'),
        peopleCount: values.peopleCount,
        routeType: values.routeType,
        destination: values.destination,
        budget: values.budget,
        remark: values.remark,
        status: '待确认',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        priorityTags: values.priorityTags || [],
      };
      addOrder(newOrder);
      message.success('车源需求发布成功！');
      setPublishVisible(false);
      setCurrentOrder(newOrder);
      setRecommendVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecommend = (order: CarOrder) => {
    setCurrentOrder(order);
    setRecommendVisible(true);
  };

  const handleAssignDriver = (driver: Driver) => {
    if (!currentOrder) return;
    assignDriverToOrder(currentOrder.id, driver);
    message.success(`已将订单派给 ${driver.name}`);
    setRecommendVisible(false);
  };

  const handleFeedback = (order: CarOrder) => {
    setCurrentOrder(order);
    feedbackForm.resetFields();
    feedbackForm.setFieldsValue({
      actualArrivalTime: order.actualArrivalTime ? dayjs(order.actualArrivalTime, 'YYYY-MM-DD HH:mm') : null,
      playerFeedback: order.playerFeedback,
      punctuality: 5,
      service: 5,
      route: 5,
      tags: [],
    });
    setFeedbackVisible(true);
  };

  const handleFeedbackSubmit = async () => {
    try {
      const values = await feedbackForm.validateFields();
      if (!currentOrder || !currentOrder.driverId || !currentOrder.driverName) {
        message.error('该订单尚未指派司机，无法评价');
        return;
      }
      
      const actualArrivalTime = values.actualArrivalTime ? values.actualArrivalTime.format('YYYY-MM-DD HH:mm') : undefined;
      
      updateOrder(currentOrder.id, {
        status: '已完成',
        actualArrivalTime,
        playerFeedback: values.playerFeedback,
      });

      const newTags = values.tags || [];
      const newEval = {
        id: `e${Date.now()}`,
        driverId: currentOrder.driverId,
        driverName: currentOrder.driverName,
        orderId: currentOrder.id,
        orderNo: currentOrder.orderNo,
        punctuality: values.punctuality,
        service: values.service,
        route: values.route,
        feedback: values.playerFeedback,
        tags: newTags,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      };
      addEvaluation(newEval);

      const driver = drivers.find(d => d.id === currentOrder.driverId);
      if (driver) {
        const existingEvals = getEvaluationsByDriver(currentOrder.driverId);
        const allEvals = [newEval, ...existingEvals];
        const avgRating = allEvals.length > 0 
          ? allEvals.reduce((sum, e) => sum + (e.punctuality + e.service + e.route) / 3, 0) / allEvals.length
          : 5;
        const mergedTags = [...new Set([...driver.tags, ...newTags])] as DriverTag[];
        updateDriver(currentOrder.driverId, {
          rating: Math.round(avgRating * 100) / 100,
          totalOrders: driver.totalOrders + 1,
          tags: mergedTags,
        });
      }

      message.success('反馈已提交，评价数据已沉淀');
      setFeedbackVisible(false);
    } catch (err) {
      console.error(err);
    }
  };

  const renderDriverEvaluation = (driver: Driver) => {
    const evals = getEvaluationsByDriver(driver.id).slice(0, 3);
    if (evals.length === 0) {
      return <Text type="secondary">暂无历史评价</Text>;
    }
    return (
      <List
        size="small"
        style={{ width: 360 }}
        dataSource={evals}
        renderItem={item => (
          <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <List.Item.Meta
              avatar={<StarOutlined style={{ color: '#faad14', fontSize: 18 }} />}
              title={
                <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                  <Space>
                    {item.orderNo && <Tag color="blue" style={{ margin: 0 }}>#{item.orderNo}</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.createdAt}</Text>
                    <Rate disabled allowHalf value={(item.punctuality + item.service + item.route) / 3} style={{ fontSize: 12 }} />
                  </Space>
                </Space>
              }
              description={
                <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                  <Space>
                    <Text type="secondary" style={{ fontSize: 11 }}>准时 {item.punctuality}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>服务 {item.service}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>路线 {item.route}</Text>
                  </Space>
                  <Text style={{ fontSize: 13 }}>💬 {item.feedback}</Text>
                  <Space wrap size={4}>
                    {item.tags.map(t => (
                      <Tag key={t} color={tagColorMap[t]} style={{ margin: 0, fontSize: 11 }}>{t}</Tag>
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

  const getMatchScore = (driver: Driver) => {
    if (!currentOrder) return 0;
    let score = 0;
    if (currentOrder.priorityTags) {
      score += currentOrder.priorityTags.filter(t => driver.tags.includes(t)).length * 15;
    }
    if (driver.usualStores.includes(currentOrder.storeId)) score += 20;
    score += Math.round(driver.rating * 6);
    if (driver.status === '在岗') score += 10;
    return Math.min(score, 100);
  };

  const getRecommendReasons = (driver: Driver): string[] => {
    if (!currentOrder) return [];
    const reasons: string[] = [];
    if (driver.usualStores.includes(currentOrder.storeId)) {
      reasons.push('常跑这家门店，路线熟');
    }
    const isNight = isNightTime(currentOrder.endTime);
    if (isNight && driver.nightService) {
      reasons.push('夜间接单稳定');
    }
    const latestEvals = getEvaluationsByDriver(driver.id).slice(0, 3);
    const recentTags = new Set<DriverTag>();
    latestEvals.forEach(e => e.tags.forEach(t => recentTags.add(t)));
    if (recentTags.has('准时')) reasons.push('最近评价都提到准时');
    if (recentTags.has('绕路少')) reasons.push('最近评价说绕路少');
    if (recentTags.has('服务好')) reasons.push('最近服务评价好');
    if (driver.fleetName && fleets.find(f => f.name === driver.fleetName)?.cooperationLevel === 'A级') {
      reasons.push('A级合作车队，靠谱');
    }
    if (driver.carCapacity === currentOrder.peopleCount || driver.carCapacity - currentOrder.peopleCount <= 3) {
      reasons.push('车型大小刚刚好');
    }
    return reasons.slice(0, 3);
  };

  const getGapReasons = (): string[] => {
    if (!currentOrder) return [];
    const reasons: string[] = [];
    const isNight = isNightTime(currentOrder.endTime);
    const allAreaDrivers = drivers.filter(d => {
      const store = stores.find(s => s.id === currentOrder.storeId);
      return store && (d.usualStores.includes(currentOrder.storeId) || d.serviceAreas.includes(store.district));
    });
    if (allAreaDrivers.length < 3) {
      reasons.push('这个门店周边合作司机偏少');
    }
    if (isNight) {
      const nightDrivers = allAreaDrivers.filter(d => d.nightService && d.status !== '休息');
      if (nightDrivers.length === 0) {
        reasons.push('夜间接单的司机都休息或出车中');
      } else if (nightDrivers.filter(d => d.carCapacity >= currentOrder.peopleCount).length === 0) {
        reasons.push('夜间可接大车的司机紧张');
      }
    }
    if (currentOrder.peopleCount > 20) {
      const bigDrivers = allAreaDrivers.filter(d => d.carCapacity >= currentOrder.peopleCount);
      if (bigDrivers.length < 2) {
        reasons.push(`${currentOrder.peopleCount}人以上的大车资源紧俏`);
      }
    }
    if (currentOrder.budget < 150) {
      reasons.push('预算偏低，可能需要协调车队加价');
    }
    if (currentOrder.priorityTags && currentOrder.priorityTags.length > 0) {
      const tagMatchDrivers = allAreaDrivers.filter(d => 
        currentOrder.priorityTags?.some(t => d.tags.includes(t))
      );
      if (tagMatchDrivers.length === 0) {
        reasons.push('符合全部标签的司机很少，建议放宽条件');
      }
    }
    return reasons.length > 0 ? reasons : ['当前条件下可用司机较少，建议联系车队调度'];
  };

  type RiskLevel = 'none' | 'warning' | 'danger';
  interface DriverRisk {
    level: RiskLevel;
    reasons: string[];
  }
  const getDriverRisks = (driver: Driver): DriverRisk => {
    if (!currentOrder) return { level: 'none', reasons: [] };
    const reasons: string[] = [];

    if (driver.carCapacity < currentOrder.peopleCount) {
      reasons.push(`⚠️ 座位不够：司机车仅${driver.carCapacity}座，需要${currentOrder.peopleCount}座`);
    }

    const isNight = isNightTime(currentOrder.endTime);
    if (isNight && !driver.nightService) {
      reasons.push('🌙 夜间能力不匹配：该司机不接夜单');
    }

    if (isNight && driver.status === '休息') {
      reasons.push('🛌 司机状态：当前已标记休息');
    }

    if (currentOrder.budget < 150 && !driver.tags.includes('价格公道')) {
      reasons.push(`💰 预算偏低：¥${currentOrder.budget}可能低于该司机预期`);
    }

    const depStart = dayjs(currentOrder.departureTime);
    const depEnd = dayjs(currentOrder.endTime);
    const conflictOrder = orders.find(o => {
      if (o.id === currentOrder.id) return false;
      if (o.driverId !== driver.id) return false;
      if (o.status === '已完成' || o.status === '待确认') return false;
      const oStart = dayjs(o.departureTime);
      const oEnd = dayjs(o.endTime);
      return depStart.isBefore(oEnd) && depEnd.isAfter(oStart);
    });
    if (conflictOrder) {
      const cStart = dayjs(conflictOrder.departureTime);
      const cEnd = dayjs(conflictOrder.endTime);
      const overlapStart = depStart.isAfter(cStart) ? depStart : cStart;
      const overlapEnd = depEnd.isBefore(cEnd) ? depEnd : cEnd;
      const overlapMins = Math.max(0, overlapEnd.diff(overlapStart, 'minute'));
      reasons.push(`⏰ 时间冲突：与订单 #${conflictOrder.orderNo} 重叠约${overlapMins}分钟（${cStart.format('HH:mm')}-${cEnd.format('HH:mm')}）`);
    }

    if (driver.status === '出车中') {
      reasons.push('🚗 司机当前出车中，需确认是否能及时赶到');
    }

    if (reasons.length === 0) return { level: 'none', reasons: [] };
    const hasDanger = reasons.some(r => r.includes('座位不够') || r.includes('时间冲突') || r.includes('不接夜单'));
    return {
      level: hasDanger ? 'danger' : 'warning',
      reasons,
    };
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      fixed: 'left' as const,
      render: (val: string) => <Text strong>{val}</Text>,
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
      render: (val: string) => (
        <Space>
          <ShopOutlined style={{ color: '#13c2c2' }} />
          <span>{val}</span>
        </Space>
      ),
    },
    {
      title: '出发时段',
      key: 'time',
      width: 220,
      render: (_: unknown, record: CarOrder) => {
        const isNight = isNightTime(record.endTime);
        return (
          <Space orientation="vertical" size={0}>
            <Space>
              <ClockCircleOutlined style={{ color: isNight ? '#eb2f96' : '#1677ff' }} />
              <Text strong>{dayjs(record.departureTime).format('MM-DD HH:mm')}</Text>
              {isNight && <Tag icon={<MoonOutlined />} color="magenta">夜间散场</Tag>}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              至 {dayjs(record.endTime).format('MM-DD HH:mm')} · {record.routeType}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '人数',
      dataIndex: 'peopleCount',
      key: 'peopleCount',
      width: 80,
      render: (val: number) => (
        <Space>
          <TeamOutlined />
          <Text strong>{val}人</Text>
        </Space>
      ),
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      ellipsis: true,
      render: (val?: string) => val ? (
        <Space>
          <EnvironmentOutlined style={{ color: '#999' }} />
          <span>{val}</span>
        </Space>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 100,
      render: (val: number) => {
        const isLow = val < 150;
        return (
          <Text strong style={{ color: isLow ? '#ff4d4f' : undefined }}>¥{val}</Text>
        );
      },
    },
    {
      title: '司机',
      key: 'driver',
      width: 120,
      render: (_: unknown, record: CarOrder) => record.driverName ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{record.driverName}</span>
        </Space>
      ) : <Text type="secondary">未派单</Text>,
    },
    {
      title: '服务进度',
      key: 'progress',
      width: 280,
      render: (_: unknown, record: CarOrder) => {
        if (record.status === '待确认') {
          return <Tag color="orange" icon={<ClockCircleOutlined />}>待确认</Tag>;
        }
        if (record.status === '已取消') {
          return <Tag color="default">已取消</Tag>;
        }
        const currentIndex = record.currentStep ? SERVICE_STEPS.indexOf(record.currentStep) : -1;
        return (
          <Popover
            content={
              <Space orientation="vertical" size="small" style={{ width: 200 }}>
                {SERVICE_STEPS.map((step, idx) => (
                  <Space key={step}>
                    {idx <= currentIndex ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
                    )}
                    <Text type={idx <= currentIndex ? undefined : 'secondary'}>{step}</Text>
                    {record.stepTimestamps?.[step] && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.stepTimestamps[step]}
                      </Text>
                    )}
                  </Space>
                ))}
              </Space>
            }
            title="服务节点详情"
            trigger="hover"
          >
            <Steps
              size="small"
              current={currentIndex + 1}
              items={SERVICE_STEPS.map(() => ({
                title: '',
                description: '',
              }))}
              style={{ minWidth: 240 }}
            />
            <Tag 
              color={record.status === '已完成' ? 'green' : 'blue'} 
              style={{ marginTop: 4 }}
            >
              {record.currentStep || record.status}
            </Tag>
          </Popover>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: CarOrder) => {
        const canAdvance = record.currentStep && SERVICE_STEPS.indexOf(record.currentStep) < SERVICE_STEPS.length - 1;
        const nextStep = record.currentStep 
          ? SERVICE_STEPS[SERVICE_STEPS.indexOf(record.currentStep) + 1]
          : null;
        return (
          <Space size="small" wrap>
            {record.status === '待确认' && (
              <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={() => handleRecommend(record)}>
                智能派单
              </Button>
            )}
            {canAdvance && record.status !== '已完成' && (
              <Button size="small" type="primary" ghost onClick={() => {
                advanceOrderStep(record.id);
                message.success(`已推进到「${nextStep}」`);
              }}>
                {nextStep}
              </Button>
            )}
            {record.status === '已完成' && !record.playerFeedback && (
              <Button size="small" icon={<EditOutlined />} onClick={() => handleFeedback(record)}>
                补录反馈
              </Button>
            )}
            {record.status === '已完成' && record.playerFeedback && (
              <Tooltip title="查看详情">
                <Button type="text" size="small" icon={<EyeOutlined />} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>订单中心</Title>
      <Text type="secondary">门店发布包场车源，智能匹配推荐司机，跟踪订单状态</Text>

      <Card style={{ marginTop: 16 }} size="small">
        <Space wrap style={{ width: '100%' }}>
          {urlFilter && (
            <Alert
              type="warning"
              showIcon
              message={
                <Space>
                  <Text strong>
                    {urlFilter === 'abnormal' ? '异常订单筛选中' : urlFilter}
                    {urlType && `：${urlType}`}
                    {urlOrderNo && ` · 订单号 ${urlOrderNo}`}
                  </Text>
                  <Button size="small" onClick={clearUrlFilter}>清除筛选</Button>
                </Space>
              }
              style={{ width: '100%', marginBottom: 8 }}
            />
          )}
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索订单号/门店"
            style={{ width: 240 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="按状态筛选"
            style={{ width: 140 }}
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
          >
            <Option value="待确认">待确认</Option>
            <Option value="已派单">已派单</Option>
            <Option value="服务中">服务中</Option>
            <Option value="已完成">已完成</Option>
          </Select>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handlePublish}>
            发布车源需求
          </Button>
        </Space>
      </Card>

      <Table
        style={{ marginTop: 16 }}
        dataSource={filteredOrders}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1300 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条订单` }}
        rowClassName={(record) => record.orderNo === urlOrderNo ? 'order-highlight' : ''}
      />

      <Modal
        title="发布车源需求"
        open={publishVisible}
        onCancel={() => setPublishVisible(false)}
        onOk={handlePublishSubmit}
        width={680}
        okText="发布并匹配司机"
        cancelText="取消"
      >
        <Form form={publishForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="storeId" label="出发门店" rules={[{ required: true, message: '请选择门店' }]}>
                <Select placeholder="选择出发门店">
                  {stores.map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="routeType" label="用车类型" rules={[{ required: true }]} initialValue="包场">
                <Radio.Group>
                  <Radio.Button value="包场">包场</Radio.Button>
                  <Radio.Button value="单程">单程</Radio.Button>
                  <Radio.Button value="往返">往返</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="timeRange" label="用车时段" rules={[{ required: true, message: '请选择用车时间' }]}>
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder={['出发时间', '散场时间']}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="peopleCount" label="人数" rules={[{ required: true, message: '请输入人数' }]}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="请输入乘车人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="budget" label="预算（元）" rules={[{ required: true, message: '请输入预算' }]}>
                <InputNumber min={50} max={5000} style={{ width: '100%' }} placeholder="本次用车预算" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="destination" label="目的地">
                <Input placeholder="目的地地址或区域，如：国贸地铁站" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="priorityTags" label="优先标签">
                <Select mode="multiple" placeholder="选择优先匹配的司机标签（可多选）">
                  {allPriorityTags.map(t => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={3} placeholder="其他说明，如：需要搬运、VIP客户等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1677ff' }} />
            <span>智能推荐司机 - {currentOrder?.orderNo}</span>
          </Space>
        }
        open={recommendVisible}
        onCancel={() => setRecommendVisible(false)}
        width={900}
        footer={null}
      >
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#f5faff', border: '1px solid #d6e4ff' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text type="secondary">门店</Text>
                  <div><Text strong>{currentOrder.storeName}</Text></div>
                </Col>
                <Col span={6}>
                  <Text type="secondary">出发时间</Text>
                  <div><Text strong>{currentOrder.departureTime}</Text></div>
                </Col>
                <Col span={6}>
                  <Text type="secondary">人数 / 预算</Text>
                  <div><Text strong>{currentOrder.peopleCount}人 / ¥{currentOrder.budget}</Text></div>
                </Col>
                <Col span={6}>
                  <Text type="secondary">优先标签</Text>
                  <div>
                    <Space wrap size={4}>
                      {currentOrder.priorityTags?.map(t => (
                        <Tag key={t} color={tagColorMap[t]}>{t}</Tag>
                      )) || <Text type="secondary">无</Text>}
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {recommendedDrivers.length === 0 ? (
              <Card size="small" style={{ background: '#fff2f0', border: '1px solid #ffccc7' }}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ color: '#cf1322', fontSize: 15 }}>
                    ⚠️ 暂未找到合适的司机
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>缺口分析：</Text>
                  <Space orientation="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                    {getGapReasons().map((reason, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Text style={{ color: '#cf1322' }}>•</Text>
                      <Text>{reason}</Text>
                      </div>
                    ))}
                  </Space>
                </div>
                <Button type="primary" danger ghost>
                  联系车队协调
                </Button>
              </Space>
            </Card>
          ) : (
              <List
                dataSource={recommendedDrivers.slice(0, 6)}
                renderItem={(driver, index) => {
                  const score = getMatchScore(driver);
                  return (
                    <List.Item
                      key={driver.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        marginBottom: 12,
                        background: index === 0 ? '#f6ffed' : '#fff',
                      }}
                      actions={[
                        <Button type="primary" icon={<CheckOutlined />} onClick={() => handleAssignDriver(driver)}>
                          指派该司机
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge count={index === 0 ? '最佳匹配' : 0} style={{ backgroundColor: index === 0 ? '#52c41a' : '#1677ff' }}>
                            <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }}>
                              {driver.name.charAt(0)}
                            </Avatar>
                          </Badge>
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: 16 }}>{driver.name}</Text>
                            {driver.fleetName && <Tag color="geekblue">{driver.fleetName}</Tag>}
                            <Tag color={driver.status === '在岗' ? 'green' : driver.status === '出车中' ? 'blue' : 'default'}>
                              {driver.status}
                            </Tag>
                            <Rate disabled allowHalf value={driver.rating} style={{ fontSize: 14 }} />
                            <Text strong style={{ color: '#faad14' }}>{driver.rating}</Text>
                            <Text type="secondary">({driver.totalOrders}单)</Text>
                          </Space>
                        }
                        description={
                          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                            <Space wrap size={8}>
                              <Space>
                                <CarOutlined style={{ color: '#666' }} />
                                <span>{driver.carType} · {driver.carCapacity}座</span>
                              </Space>
                              <Space>
                                <PhoneOutlined style={{ color: '#52c41a' }} />
                                <span>{driver.phone}</span>
                              </Space>
                              <Space>
                                <EnvironmentOutlined style={{ color: '#999' }} />
                                <span>{driver.serviceAreas.join('、')}</span>
                              </Space>
                              {driver.nightService && (
                                <Tag icon={<MoonOutlined />} color="magenta">可夜间接单</Tag>
                              )}
                            </Space>
                            <Space wrap size={4}>
                              {driver.tags.map(t => {
                                const isPriority = currentOrder.priorityTags?.includes(t);
                                return (
                                  <Tag
                                    key={t}
                                    color={tagColorMap[t]}
                                    style={{
                                      margin: 0,
                                      border: isPriority ? '2px solid #1677ff' : undefined,
                                      fontWeight: isPriority ? 600 : 400,
                                    }}
                                  >
                                    {isPriority ? '★ ' : ''}{t}
                                  </Tag>
                                );
                              })}
                            </Space>
                            {getRecommendReasons(driver).length > 0 && (
                              <div style={{ 
                                background: '#f6ffed', 
                                padding: '8px 12px', 
                                borderRadius: 6,
                                border: '1px solid #b7eb8f',
                              }}>
                                <Text strong style={{ color: '#389e0d', fontSize: 12 }}>💡 推荐理由</Text>
                                <Space wrap size={[8, 4]} style={{ marginTop: 4 }}>
                                  {getRecommendReasons(driver).map((reason, idx) => (
                                    <Tag key={idx} color="success" style={{ margin: 0, fontSize: 12 }}>
                                      {reason}
                                    </Tag>
                                  ))}
                                </Space>
                              </div>
                            )}
                            {(() => {
                              const risk = getDriverRisks(driver);
                              if (risk.level === 'none') return null;
                              const bgColor = risk.level === 'danger' ? '#fff2f0' : '#fffbe6';
                              const borderColor = risk.level === 'danger' ? '#ffccc7' : '#ffe58f';
                              const titleColor = risk.level === 'danger' ? '#cf1322' : '#d48806';
                              const tagColor = risk.level === 'danger' ? 'error' : 'warning';
                              const tagIcon = risk.level === 'danger' ? '🚫 不建议派单' : '⚠️ 派单风险';
                              return (
                                <div style={{ 
                                  background: bgColor, 
                                  padding: '8px 12px', 
                                  borderRadius: 6,
                                  border: `1px solid ${borderColor}`,
                                }}>
                                  <Text strong style={{ color: titleColor, fontSize: 12 }}>{tagIcon}</Text>
                                  <Space orientation="vertical" size={4} style={{ marginTop: 4, width: '100%' }}>
                                    {risk.reasons.map((r, idx) => (
                                      <Tag key={idx} color={tagColor} style={{ margin: 0, fontSize: 12, width: '100%' }}>
                                        {r}
                                      </Tag>
                                    ))}
                                  </Space>
                                </div>
                              );
                            })()}
                            
                            {renderScheduleBar(driver)}
                            
                            <Space size={16} style={{ width: '100%' }}>
                              <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>匹配度</Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${score}%`,
                                        background: score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : '#faad14',
                                        borderRadius: 4,
                                      }}
                                    />
                                  </div>
                                  <Text strong style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#1677ff' : '#faad14' }}>
                                    {score}分
                                  </Text>
                                </div>
                              </div>
                              <Popover content={renderDriverEvaluation(driver)} title="最近服务评价" trigger="click">
                                <Button type="link" size="small" icon={<StarOutlined />}>查看历史评价</Button>
                              </Popover>
                              <Button type="link" size="small" icon={<ClockCircleOutlined />} onClick={() => handleViewSchedule(driver)}>
                                查看日程
                              </Button>
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}

            {filteredOutDrivers.length > 0 && (
              <Collapse
                style={{ marginTop: 16 }}
                size="small"
                items={[{
                  key: 'filtered',
                  label: (
                    <Space>
                      <StopOutlined style={{ color: '#ff4d4f' }} />
                      <span>查看被过滤的司机（{filteredOutDrivers.length}人）</span>
                      <Tag color="default">人工协调参考</Tag>
                    </Space>
                  ),
                  children: (
                    <List
                      size="small"
                      dataSource={filteredOutDrivers}
                      renderItem={({ driver, reasons }) => (
                        <List.Item
                          style={{
                            padding: '12px',
                            border: '1px dashed #ffccc7',
                            borderRadius: 6,
                            marginBottom: 8,
                            background: '#fffbf0',
                          }}
                          actions={[
                            <Tooltip title="强制派单需人工确认风险">
                              <Button 
                                size="small" 
                                danger 
                                ghost
                                onClick={() => {
                                  Modal.confirm({
                                    title: '确认强制派单？',
                                    content: `该司机存在以下风险：\n${reasons.join('\n')}\n\n建议先电话联系司机确认。`,
                                    okText: '确认派单',
                                    okType: 'danger',
                                    cancelText: '取消',
                                    onOk: () => handleAssignDriver(driver),
                                  });
                                }}
                              >
                                仍要派单
                              </Button>
                            </Tooltip>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#8c8c8c' }} />}
                            title={
                              <Space>
                                <Text strong>{driver.name}</Text>
                                <Text type="secondary">{driver.carType} · {driver.carCapacity}座</Text>
                                <Tag color={driver.status === '在岗' ? 'green' : driver.status === '出车中' ? 'blue' : 'default'}>
                                  {driver.status}
                                </Tag>
                                <Rate disabled allowHalf value={driver.rating} style={{ fontSize: 12 }} />
                              </Space>
                            }
                            description={
                              <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                                <Space wrap size={4}>
                                  {reasons.map((r, idx) => (
                                    <Tag key={idx} color="error" style={{ margin: 0 }}>{r}</Tag>
                                  ))}
                                </Space>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                }]}
              />
            )}
          </div>
        )}
      </Modal>

      {scheduleDriver && currentOrder && (
        <Modal
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#1677ff' }} />
              <span>司机日程视图 - {scheduleDriver.name}</span>
              <Tag color="blue">{dayjs(currentOrder.departureTime).format('YYYY-MM-DD')}</Tag>
            </Space>
          }
          open={scheduleVisible}
          onCancel={() => setScheduleVisible(false)}
          width={720}
          footer={
            <Space>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => handleAssignDriver(scheduleDriver)}
              >
                指派该司机
              </Button>
              <Button onClick={() => setScheduleVisible(false)}>
                关闭
              </Button>
            </Space>
          }
        >
          {(() => {
            const sched = getDriverSchedule(scheduleDriver);
            const targetStart = dayjs(currentOrder.departureTime);
            const targetEnd = dayjs(currentOrder.endTime);
            const hasConflict = sched.events.some(ev => 
              targetStart.isBefore(ev.end) && targetEnd.isAfter(ev.start)
            );

            return (
              <div>
                <Alert
                  type={hasConflict ? 'error' : 'success'}
                  showIcon
                  title={
                    hasConflict 
                      ? '⚠️ 该时段存在冲突' 
                      : '✅ 该时段可正常派单'
                  }
                  description={
                    <Space>
                      <Text>用车时段：</Text>
                      <Tag color="blue">{targetStart.format('HH:mm')} - {targetEnd.format('HH:mm')}</Tag>
                      <Tag>{currentOrder.storeName} · {currentOrder.peopleCount}人</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                />

                <Card size="small" title="当日时间轴（08:00 - 24:00）">
                  <div style={{ position: 'relative', height: 60, background: '#f5f5f5', borderRadius: 6, marginBottom: 16 }}>
                    {sched.blocks.map((block, idx) => {
                      const left = ((block.start - sched.startHour) / sched.totalHours) * 100;
                      const width = ((block.end - block.start) / sched.totalHours) * 100;
                      const color = block.type === 'idle' ? '#52c41a' :
                                    block.type === 'inservice' ? '#13c2c2' :
                                    block.type === 'completed' ? '#8c8c8c' : '#1677ff';
                      const label = block.type === 'idle' ? '空闲' :
                                    block.type === 'inservice' ? '服务中' :
                                    block.type === 'completed' ? '已完成' : '已派单';
                      return (
                        <Tooltip
                          key={idx}
                          title={
                            <Space orientation="vertical" size={2} style={{ minWidth: 180 }}>
                              <Text strong>{label}</Text>
                              <Text>
                                {Math.floor(block.start)}:{String(Math.round((block.start%1)*60)).padStart(2,'0')} - {Math.floor(block.end)}:{String(Math.round((block.end%1)*60)).padStart(2,'0')}
                              </Text>
                              {block.orderNo && <Text>订单 #{block.orderNo}</Text>}
                              {block.storeName && <Text>{block.storeName}</Text>}
                            </Space>
                          }
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: `${left}%`,
                              width: `${width}%`,
                              top: 10,
                              height: 40,
                              background: color,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 4,
                              cursor: 'pointer',
                              overflow: 'hidden',
                              padding: '0 4px',
                            }}
                          >
                            {block.orderNo ? `#${block.orderNo} · ${label}` : label}
                          </div>
                        </Tooltip>
                      );
                    })}
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        bottom: 6,
                        left: `${((targetStart.hour() + targetStart.minute()/60 - sched.startHour) / sched.totalHours) * 100}%`,
                        width: `${((targetEnd.hour() + targetEnd.minute()/60 - targetStart.hour() - targetStart.minute()/60) / sched.totalHours) * 100}%`,
                        border: `2px dashed ${hasConflict ? '#ff4d4f' : '#faad14'}`,
                        borderRadius: 6,
                        background: hasConflict ? 'rgba(255,77,79,0.15)' : 'rgba(250,173,20,0.15)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Text key={i} type="secondary" style={{ fontSize: 11 }}>
                        {sched.startHour + i * 2}:00
                      </Text>
                    ))}
                  </div>

                  <Row gutter={8}>
                    <Col span={6}>
                      <Space>
                        <div style={{ width: 12, height: 12, background: '#52c41a', borderRadius: 2 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>空闲</Text>
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space>
                        <div style={{ width: 12, height: 12, background: '#1677ff', borderRadius: 2 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>已派单</Text>
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space>
                        <div style={{ width: 12, height: 12, background: '#13c2c2', borderRadius: 2 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>服务中</Text>
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space>
                        <div style={{ width: 12, height: 12, background: '#8c8c8c', borderRadius: 2 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>已完成</Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="当日订单明细" style={{ marginTop: 12 }}>
                  {sched.events.length === 0 ? (
                    <Text type="secondary">当日暂无订单</Text>
                  ) : (
                    <List
                      size="small"
                      dataSource={sched.events}
                      renderItem={ev => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Space>
                                <Tag color={
                                  ev.status === '已完成' ? 'default' : 
                                  ev.status === '服务中' ? 'processing' : 'blue'
                                }>
                                  #{ev.orderNo}
                                </Tag>
                                <Text strong>{ev.storeName}</Text>
                                <Text type="secondary">{ev.peopleCount}人</Text>
                              </Space>
                            }
                            description={
                              <Space>
                                <Text type="secondary">
                                  {ev.start.format('HH:mm')} - {ev.end.format('HH:mm')}
                                </Text>
                                <Tag color={ev.status === '已完成' ? 'default' : ev.status === '服务中' ? 'processing' : 'blue'}>
                                  {ev.currentStep || ev.status}
                                </Tag>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </div>
            );
          })()}
        </Modal>
      )}

      <Modal
        title="补录服务反馈"
        open={feedbackVisible}
        onCancel={() => setFeedbackVisible(false)}
        onOk={handleFeedbackSubmit}
        okText="提交反馈"
        cancelText="取消"
      >
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space orientation="vertical" size={4}>
                <Text>订单号：<Text strong>{currentOrder.orderNo}</Text></Text>
                <Text>门店：{currentOrder.storeName}</Text>
                <Text>司机：{currentOrder.driverName || '未派单'}</Text>
                <Text>出发时间：{currentOrder.departureTime}</Text>
              </Space>
            </Card>
            <Form form={feedbackForm} layout="vertical">
              <Form.Item
                name="actualArrivalTime"
                label="实际到店时间"
                rules={[{ required: true, message: '请选择实际到店时间' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择司机实际到达时间"
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="punctuality" label="准时性" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="service" label="服务态度" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="route" label="路线熟悉度" rules={[{ required: true }]}>
                    <Rate />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="tags" label="服务标签">
                <Select mode="multiple" placeholder="选择符合的服务标签">
                  {allPriorityTags.map(t => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="playerFeedback"
                label="玩家反馈"
                rules={[{ required: true, message: '请输入玩家反馈' }]}
              >
                <TextArea rows={4} placeholder="记录玩家乘车体验、司机服务情况等" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderCenter;
