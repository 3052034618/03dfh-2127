export type DriverTag = '好约' | '准时' | '绕路少' | '适合大车' | '夜间活跃' | '服务好' | '熟悉路线' | '价格公道';

export type OrderStatus = '待确认' | '已派单' | '服务中' | '已完成' | '已取消';

export type ServiceStep = '已派单' | '司机已出发' | '已到店' | '已接到玩家' | '送达完成';

export interface Store {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  manager: string;
}

export interface Fleet {
  id: string;
  name: string;
  contact: string;
  phone: string;
  driverCount: number;
  cooperationLevel: 'A级' | 'B级' | 'C级';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  fleetId?: string;
  fleetName?: string;
  carType: string;
  carCapacity: number;
  plateNumber: string;
  serviceAreas: string[];
  nightService: boolean;
  usualStores: string[];
  tags: DriverTag[];
  rating: number;
  totalOrders: number;
  status: '在岗' | '休息' | '出车中';
  avatar?: string;
}

export interface OrderEvaluation {
  id: string;
  driverId: string;
  driverName: string;
  orderId: string;
  orderNo?: string;
  punctuality: number;
  service: number;
  route: number;
  feedback: string;
  tags: DriverTag[];
  createdAt: string;
}

export interface CarOrder {
  id: string;
  orderNo: string;
  storeId: string;
  storeName: string;
  departureTime: string;
  endTime: string;
  peopleCount: number;
  routeType: '包场' | '单程' | '往返';
  destination?: string;
  budget: number;
  remark?: string;
  status: OrderStatus;
  currentStep?: ServiceStep;
  stepTimestamps?: Partial<Record<ServiceStep, string>>;
  driverId?: string;
  driverName?: string;
  actualArrivalTime?: string;
  playerFeedback?: string;
  createdAt: string;
  priorityTags?: DriverTag[];
}
