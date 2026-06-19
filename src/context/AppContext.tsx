import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Driver, Fleet, Store, CarOrder, OrderEvaluation, DriverTag } from '../types';
import { mockDrivers, mockFleets, mockStores, mockOrders, mockEvaluations } from '../data/mockData';

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
