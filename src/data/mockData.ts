import type { Store, Fleet, Driver, CarOrder, OrderEvaluation } from '../types';

export const mockStores: Store[] = [
  { id: 's1', name: '迷雾剧社·朝阳店', address: '朝阳区建国路88号SOHO现代城', district: '朝阳区', phone: '010-8888-0001', manager: '张经理' },
  { id: 's2', name: '迷雾剧社·海淀店', address: '海淀区中关村大街1号', district: '海淀区', phone: '010-8888-0002', manager: '李经理' },
  { id: 's3', name: '迷雾剧社·西城店', address: '西城区金融街15号', district: '西城区', phone: '010-8888-0003', manager: '王经理' },
  { id: 's4', name: '迷雾剧社·东城店', address: '东城区王府井大街201号', district: '东城区', phone: '010-8888-0004', manager: '赵经理' },
  { id: 's5', name: '迷雾剧社·丰台店', address: '丰台区南三环西路16号', district: '丰台区', phone: '010-8888-0005', manager: '刘经理' },
];

export const mockFleets: Fleet[] = [
  { id: 'f1', name: '金牌车队', contact: '陈队长', phone: '13800000001', driverCount: 12, cooperationLevel: 'A级' },
  { id: 'f2', name: '顺达车队', contact: '王队长', phone: '13800000002', driverCount: 8, cooperationLevel: 'A级' },
  { id: 'f3', name: '安捷车队', contact: '刘队长', phone: '13800000003', driverCount: 15, cooperationLevel: 'B级' },
  { id: 'f4', name: '星程车队', contact: '赵队长', phone: '13800000004', driverCount: 6, cooperationLevel: 'B级' },
  { id: 'f5', name: '合众车队', contact: '孙队长', phone: '13800000005', driverCount: 20, cooperationLevel: 'C级' },
];

export const mockDrivers: Driver[] = [
  {
    id: 'd1', name: '张明远', phone: '13900000001', fleetId: 'f1', fleetName: '金牌车队',
    carType: '19座考斯特', carCapacity: 19, plateNumber: '京A·12345',
    serviceAreas: ['朝阳区', '海淀区', '东城区'], nightService: true,
    usualStores: ['s1', 's2', 's4'], tags: ['好约', '准时', '服务好', '熟悉路线'],
    rating: 4.9, totalOrders: 156, status: '在岗'
  },
  {
    id: 'd2', name: '李建军', phone: '13900000002', fleetId: 'f1', fleetName: '金牌车队',
    carType: '35座大巴', carCapacity: 35, plateNumber: '京A·23456',
    serviceAreas: ['朝阳区', '海淀区', '西城区', '丰台区'], nightService: true,
    usualStores: ['s1', 's3', 's5'], tags: ['适合大车', '准时', '绕路少'],
    rating: 4.8, totalOrders: 98, status: '出车中'
  },
  {
    id: 'd3', name: '王志强', phone: '13900000003', fleetId: 'f2', fleetName: '顺达车队',
    carType: '14座金杯', carCapacity: 14, plateNumber: '京B·34567',
    serviceAreas: ['海淀区', '西城区', '丰台区'], nightService: false,
    usualStores: ['s2', 's3', 's5'], tags: ['好约', '价格公道', '绕路少'],
    rating: 4.7, totalOrders: 72, status: '在岗'
  },
  {
    id: 'd4', name: '赵德才', phone: '13900000004', fleetId: 'f2', fleetName: '顺达车队',
    carType: '7座商务车', carCapacity: 7, plateNumber: '京B·45678',
    serviceAreas: ['朝阳区', '东城区'], nightService: true,
    usualStores: ['s1', 's4'], tags: ['夜间活跃', '准时', '服务好', '好约'],
    rating: 4.95, totalOrders: 201, status: '在岗'
  },
  {
    id: 'd5', name: '刘国庆', phone: '13900000005', fleetId: 'f3', fleetName: '安捷车队',
    carType: '22座中巴', carCapacity: 22, plateNumber: '京C·56789',
    serviceAreas: ['朝阳区', '海淀区', '西城区', '东城区', '丰台区'], nightService: true,
    usualStores: ['s1', 's2', 's3', 's4', 's5'], tags: ['适合大车', '熟悉路线', '价格公道'],
    rating: 4.6, totalOrders: 134, status: '休息'
  },
  {
    id: 'd6', name: '孙建华', phone: '13900000006', fleetId: 'f3', fleetName: '安捷车队',
    carType: '19座考斯特', carCapacity: 19, plateNumber: '京C·67890',
    serviceAreas: ['东城区', '西城区'], nightService: false,
    usualStores: ['s3', 's4'], tags: ['准时', '绕路少'],
    rating: 4.5, totalOrders: 45, status: '在岗'
  },
  {
    id: 'd7', name: '周明辉', phone: '13900000007', fleetId: 'f4', fleetName: '星程车队',
    carType: '14座金杯', carCapacity: 14, plateNumber: '京D·78901',
    serviceAreas: ['丰台区', '海淀区'], nightService: true,
    usualStores: ['s2', 's5'], tags: ['夜间活跃', '好约', '价格公道'],
    rating: 4.4, totalOrders: 38, status: '在岗'
  },
  {
    id: 'd8', name: '吴海涛', phone: '13900000008', fleetId: 'f4', fleetName: '星程车队',
    carType: '7座商务车', carCapacity: 7, plateNumber: '京D·89012',
    serviceAreas: ['朝阳区', '海淀区', '东城区'], nightService: true,
    usualStores: ['s1', 's2', 's4'], tags: ['夜间活跃', '服务好', '准时'],
    rating: 4.8, totalOrders: 112, status: '出车中'
  },
  {
    id: 'd9', name: '郑卫东', phone: '13900000009', fleetId: 'f5', fleetName: '合众车队',
    carType: '35座大巴', carCapacity: 35, plateNumber: '京E·90123',
    serviceAreas: ['朝阳区', '海淀区', '丰台区'], nightService: false,
    usualStores: ['s1', 's2', 's5'], tags: ['适合大车', '熟悉路线'],
    rating: 4.3, totalOrders: 67, status: '在岗'
  },
  {
    id: 'd10', name: '钱志勇', phone: '13900000010', fleetId: 'f5', fleetName: '合众车队',
    carType: '22座中巴', carCapacity: 22, plateNumber: '京E·01234',
    serviceAreas: ['朝阳区', '西城区', '东城区'], nightService: true,
    usualStores: ['s1', 's3', 's4'], tags: ['好约', '服务好', '绕路少', '夜间活跃'],
    rating: 4.7, totalOrders: 89, status: '在岗'
  },
];

export const mockOrders: CarOrder[] = [
  {
    id: 'o1', orderNo: 'CY20260620001',
    storeId: 's1', storeName: '迷雾剧社·朝阳店',
    departureTime: '2026-06-20 22:30', endTime: '2026-06-21 00:00',
    peopleCount: 18, routeType: '包场', destination: '国贸地铁站',
    budget: 380, remark: '团建包场，需要搬运行李',
    status: '待确认', createdAt: '2026-06-20 10:00',
    priorityTags: ['夜间活跃', '适合大车', '准时']
  },
  {
    id: 'o2', orderNo: 'CY20260620002',
    storeId: 's2', storeName: '迷雾剧社·海淀店',
    departureTime: '2026-06-20 23:00', endTime: '2026-06-20 23:45',
    peopleCount: 6, routeType: '单程', destination: '中关村地铁站',
    budget: 120, remark: '玩家散场送地铁站',
    status: '已派单', driverId: 'd4', driverName: '赵德才',
    createdAt: '2026-06-20 11:30',
    priorityTags: ['好约', '准时']
  },
  {
    id: 'o3', orderNo: 'CY20260620003',
    storeId: 's3', storeName: '迷雾剧社·西城店',
    departureTime: '2026-06-21 14:00', endTime: '2026-06-21 18:00',
    peopleCount: 30, routeType: '包场', destination: '密云团建基地',
    budget: 800, remark: '跨区团建，需要提前到店等候',
    status: '待确认', createdAt: '2026-06-20 09:00',
    priorityTags: ['适合大车', '熟悉路线']
  },
  {
    id: 'o4', orderNo: 'CY20260619008',
    storeId: 's4', storeName: '迷雾剧社·东城店',
    departureTime: '2026-06-19 22:00', endTime: '2026-06-19 23:30',
    peopleCount: 12, routeType: '往返', destination: '王府井地铁站',
    budget: 300, remark: '老玩家VIP场次',
    status: '已完成', driverId: 'd1', driverName: '张明远',
    actualArrivalTime: '2026-06-19 21:55',
    playerFeedback: '司机很准时，服务态度好，路线熟悉',
    createdAt: '2026-06-19 14:00'
  },
  {
    id: 'o5', orderNo: 'CY20260620004',
    storeId: 's5', storeName: '迷雾剧社·丰台店',
    departureTime: '2026-06-20 21:30', endTime: '2026-06-20 22:30',
    peopleCount: 15, routeType: '包场', destination: '北京南站',
    budget: 180, remark: '低预算，可接受小型车辆',
    status: '待确认', createdAt: '2026-06-20 15:00',
    priorityTags: ['价格公道']
  },
  {
    id: 'o6', orderNo: 'CY20260619009',
    storeId: 's1', storeName: '迷雾剧社·朝阳店',
    departureTime: '2026-06-19 23:30', endTime: '2026-06-20 00:30',
    peopleCount: 8, routeType: '单程', destination: '望京SOHO',
    budget: 150, remark: '',
    status: '已完成', driverId: 'd8', driverName: '吴海涛',
    actualArrivalTime: '2026-06-19 23:28',
    playerFeedback: '夜间接单很快，车内干净',
    createdAt: '2026-06-19 20:00'
  },
  {
    id: 'o7', orderNo: 'CY20260620005',
    storeId: 's2', storeName: '迷雾剧社·海淀店',
    departureTime: '2026-06-21 09:00', endTime: '2026-06-21 17:00',
    peopleCount: 20, routeType: '包场', destination: '怀柔团建基地',
    budget: 650, remark: '跨区支援，全天包场',
    status: '已派单', driverId: 'd5', driverName: '刘国庆',
    createdAt: '2026-06-20 08:00',
    priorityTags: ['适合大车', '熟悉路线', '服务好']
  },
  {
    id: 'o8', orderNo: 'CY20260620006',
    storeId: 's3', storeName: '迷雾剧社·西城店',
    departureTime: '2026-06-20 22:00', endTime: '2026-06-20 23:00',
    peopleCount: 10, routeType: '单程', destination: '西单地铁站',
    budget: 80, remark: '临时加单',
    status: '待确认', createdAt: '2026-06-20 18:00',
    priorityTags: ['好约', '准时']
  },
];

export const mockEvaluations: OrderEvaluation[] = [
  {
    id: 'e1', driverId: 'd1', driverName: '张明远', orderId: 'o4',
    punctuality: 5, service: 5, route: 5,
    feedback: '提前10分钟到店，主动帮忙搬运行李，路线规划合理，全程无绕路',
    tags: ['准时', '服务好', '绕路少', '熟悉路线'],
    createdAt: '2026-06-20 10:30'
  },
  {
    id: 'e2', driverId: 'd8', driverName: '吴海涛', orderId: 'o6',
    punctuality: 5, service: 4, route: 5,
    feedback: '夜间接单响应快，车内整洁，驾驶平稳',
    tags: ['夜间活跃', '准时', '服务好'],
    createdAt: '2026-06-20 09:00'
  },
  {
    id: 'e3', driverId: 'd2', driverName: '李建军', orderId: 'o0',
    punctuality: 5, service: 4, route: 4,
    feedback: '大巴车准时到达，车况良好，价格合理',
    tags: ['适合大车', '准时', '价格公道'],
    createdAt: '2026-06-18 22:00'
  },
  {
    id: 'e4', driverId: 'd4', driverName: '赵德才', orderId: 'o0',
    punctuality: 5, service: 5, route: 5,
    feedback: '商务车司机非常专业，服务周到，夜间行车安全',
    tags: ['夜间活跃', '准时', '服务好', '绕路少'],
    createdAt: '2026-06-17 23:30'
  },
  {
    id: 'e5', driverId: 'd10', driverName: '钱志勇', orderId: 'o0',
    punctuality: 4, service: 5, route: 4,
    feedback: '司机人很好，约时间很方便，路上还推荐了夜宵',
    tags: ['好约', '服务好', '夜间活跃'],
    createdAt: '2026-06-16 22:45'
  },
];
