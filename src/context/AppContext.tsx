import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Driver, Fleet, Store, CarOrder, OrderEvaluation, DriverTag, ServiceStep } from '../types';
import { mockDrivers, mockFleets, mockStores, mockOrders, mockEvaluations } from '../data/mockData';
import dayjs from 'dayjs';

export const SERVICE_STEPS: ServiceStep[] = ['已派单', '司机已出发', '已到店', '已接到玩家', '送达完成'];

interface AppContextType {
  drivers: Driver[];
  fleets: Fleet[];
  stores: Store[];
  orders: CarOrder[];
  evaluations: OrderEvaluation[];
  addDriver: (driver: Driver) => void;
  updateDriver: (id: string, driver: Partial<Driver>) => void;
  addOrder: (order: CarOrder) => void;
  updateOrder: (id: string, order: Partial<CarOrder>) => void;
  addEvaluation: (evaluation: OrderEvaluation) => void;
  updateFleet: (id: string, fleet: Partial<Fleet>) => void;
  assignDriverToOrder: (orderId: string, driver: Driver) => void;
  advanceOrderStep: (orderId: string) => void;
  getDriversByFilter: (storeId?: string, isNight?: boolean, peopleCount?: number, tags?: DriverTag[]) => Driver[];
  getEvaluationsByDriver: (driverId: string) => OrderEvaluation[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [fleets, setFleets] = useState<Fleet[]>(mockFleets);
  const [stores] = useState<Store[]>(mockStores);
  const [orders, setOrders] = useState<CarOrder[]>(mockOrders);
  const [evaluations, setEvaluations] = useState<OrderEvaluation[]>(mockEvaluations);

  const addDriver = useCallback((driver: Driver) => {
    setDrivers(prev => [...prev, driver]);
  }, []);

  const updateDriver = useCallback((id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const updateFleet = useCallback((id: string, updates: Partial<Fleet>) => {
    setFleets(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (updates.name) {
      setDrivers(prev => prev.map(d => d.fleetId === id ? { ...d, fleetName: updates.name } : d));
    }
  }, []);

  const addOrder = useCallback((order: CarOrder) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<CarOrder>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const assignDriverToOrder = useCallback((orderId: string, driver: Driver) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const stepTimestamps = {
      '已派单': now,
      '司机已出发': '',
      '已到店': '',
      '已接到玩家': '',
      '送达完成': '',
    } as Record<ServiceStep, string>;
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: '已派单',
      driverId: driver.id,
      driverName: driver.name,
      currentStep: '已派单',
      stepTimestamps,
    } : o));
  }, []);

  const advanceOrderStep = useCallback((orderId: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const currentIndex = o.currentStep ? SERVICE_STEPS.indexOf(o.currentStep) : -1;
      if (currentIndex >= SERVICE_STEPS.length - 1) return o;
      const nextStep = SERVICE_STEPS[currentIndex + 1];
      const newTimestamps = {
        ...(o.stepTimestamps || {} as Record<ServiceStep, string>),
        [nextStep]: now,
      };
      const newStatus = nextStep === '送达完成' ? '已完成' : (currentIndex >= 0 ? '服务中' : o.status);
      return {
        ...o,
        currentStep: nextStep,
        stepTimestamps: newTimestamps,
        status: newStatus,
        actualArrivalTime: nextStep === '已到店' ? now : o.actualArrivalTime,
      };
    }));
  }, []);

  const addEvaluation = useCallback((evaluation: OrderEvaluation) => {
    setEvaluations(prev => [evaluation, ...prev]);
  }, []);

  const getDriversByFilter = useCallback((storeId?: string, isNight?: boolean, peopleCount?: number, tags?: DriverTag[]) => {
    return drivers.filter(driver => {
      if (driver.status === '休息') return false;
      if (storeId && !driver.usualStores.includes(storeId) && !driver.serviceAreas.includes(stores.find(s => s.id === storeId)?.district || '')) {
        return false;
      }
      if (isNight !== undefined && isNight && !driver.nightService) return false;
      if (peopleCount && driver.carCapacity < peopleCount) return false;
      if (tags && tags.length > 0) {
        const hasMatch = tags.some(t => driver.tags.includes(t));
        if (!hasMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      const aMatch = tags ? tags.filter(t => a.tags.includes(t)).length : 0;
      const bMatch = tags ? tags.filter(t => b.tags.includes(t)).length : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      if (storeId) {
        const aStoreMatch = a.usualStores.includes(storeId) ? 1 : 0;
        const bStoreMatch = b.usualStores.includes(storeId) ? 1 : 0;
        if (bStoreMatch !== aStoreMatch) return bStoreMatch - aStoreMatch;
      }
      return b.rating - a.rating;
    });
  }, [drivers, stores]);

  const getEvaluationsByDriver = useCallback((driverId: string) => {
    return evaluations.filter(e => e.driverId === driverId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [evaluations]);

  return (
    <AppContext.Provider value={{
      drivers, fleets, stores, orders, evaluations,
      addDriver, updateDriver, addOrder, updateOrder, addEvaluation, updateFleet,
      assignDriverToOrder, advanceOrderStep,
      getDriversByFilter, getEvaluationsByDriver
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
