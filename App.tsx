import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SupplierPanel from './components/SupplierPanel';
import StorePanel from './components/StorePanel';
import Login from './components/Login';
import { ViewState, StoreAccount, Order, ModelCategory, ModelItem, OrderStatus } from './types';
import { Armchair } from 'lucide-react';

// --- MOCK DATA INITIALIZATION ---
const INITIAL_STORES: StoreAccount[] = [
  { id: '1', name: 'گالری مبل ولیعصر', username: 'mobl1', password: '123', ownerName: 'محمد', ownerLastName: 'احمدی', phone: '09121111111', address: 'تهران، ولیعصر', isActive: true },
  { id: '2', name: 'دکوراسیون مدرن افق', username: 'decor2', password: '123', ownerName: 'علی', ownerLastName: 'رضایی', phone: '09122222222', address: 'کرج، عظیمیه', isActive: true }
];

const INITIAL_CATEGORIES: ModelCategory[] = [
  { id: 'cat_1', name: 'مدل ماتینا', isActive: true },
  { id: 'cat_2', name: 'مدل چستر', isActive: true },
];

const INITIAL_ITEMS: ModelItem[] = [
  { id: 'item_1', categoryId: 'cat_1', name: 'مبل تک نفره مدل ماتینا', basePrice: 15000000, isActive: true },
  { id: 'item_2', categoryId: 'cat_1', name: 'کاناپه ۳ نفره مدل ماتینا', basePrice: 45000000, isActive: true },
  { id: 'item_3', categoryId: 'cat_2', name: 'ست کامل ۷ نفره مدل چستر', basePrice: 120000000, isActive: true },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoreAccount | null>(null);
  const [loginError, setLoginError] = useState('');

  // --- DATABASE STATE SIMULATION ---
  const [stores, setStores] = useState<StoreAccount[]>(INITIAL_STORES);
  const [categories, setCategories] = useState<ModelCategory[]>(INITIAL_CATEGORIES);
  const [items, setItems] = useState<ModelItem[]>(INITIAL_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // --- APP SETTINGS STATE ---
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // --- AUTH HANDLERS ---
  const handleLogin = (username: string, password: string) => {
      setLoginError('');
      if (currentView === 'supplier') {
          if (password === 'admin') setIsAuthenticated(true);
          else setLoginError('رمز عبور اشتباه است.');
      } else if (currentView === 'store') {
          const store = stores.find(s => s.username === username && s.password === password && s.isActive);
          if (store) {
              setIsAuthenticated(true);
              setCurrentUser(store);
          } else {
              setLoginError('نام کاربری اشتباه است یا حساب غیرفعال شده.');
          }
      }
  };

  const handleViewChange = (view: ViewState) => {
      setLoginError('');
      if (view === 'landing' || view !== currentView) {
          setIsAuthenticated(false);
          setCurrentUser(null);
      }
      setCurrentView(view);
  };

  // --- DATA HANDLERS (Admin Actions) ---
  
  // Stores
  const handleAddStore = (store: StoreAccount) => {
      setStores(prev => {
        const exists = prev.find(s => s.id === store.id);
        return exists ? prev.map(s => s.id === store.id ? store : s) : [...prev, store];
      });
  };
  const handleDeleteStore = (id: string) => setStores(prev => prev.filter(s => s.id !== id));

  // Models (Categories)
  const handleAddCategory = (name: string) => {
      setCategories(prev => [...prev, { id: `cat_${Date.now()}`, name, isActive: true }]);
  };
  
  const handleUpdateCategory = (id: string, newName: string) => {
      const oldCategory = categories.find(c => c.id === id);
      if (!oldCategory) return;
      const oldName = oldCategory.name;

      // 1. Update Category Name
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));

      // 2. Cascade Update to Items containing the old category name
      setItems(prev => prev.map(item => {
          if (item.categoryId === id && item.name.includes(oldName)) {
              // Replace the old category name part with the new one
              return { ...item, name: item.name.replace(oldName, newName) };
          }
          return item;
      }));
  };

  const handleToggleCategory = (id: string) => {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };
  const handleDeleteCategory = (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      setItems(prev => prev.filter(i => i.categoryId !== id)); // Cascade delete items safely
  };

  // Items (Sub-products)
  const handleAddItem = (item: ModelItem) => {
      // Using functional update is CRITICAL here for batch adds to work correctly
      setItems(prev => [...prev, item]);
  };
  const handleUpdateItem = (updated: ModelItem) => {
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  };
  const handleDeleteItem = (id: string) => {
      setItems(prev => prev.filter(i => i.id !== id));
  };

  // Orders
  const handlePlaceOrder = (order: Order) => {
      setOrders(prev => [order, ...prev]);
  };
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // General Update Order Details (For editing name, address, date etc.)
  const handleUpdateOrderDetails = (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  // --- RENDER ---
  const renderContent = () => {
      if (currentView === 'landing') {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6 animate-fadeIn bg-white">
              <div className="w-24 h-24 bg-yellow-50 text-primary border-4 border-primary rounded-full flex items-center justify-center mb-4 animate-bounce overflow-hidden shadow-lg">
                {appLogo ? <img src={appLogo} alt="Logo" className="w-full h-full object-cover" /> : <Armchair size={48} />}
              </div>
              <h2 className="text-3xl font-black text-black">به سامانه مدیریت سفارشات خوش آمدید</h2>
              <p className="text-gray-500 max-w-md text-lg leading-relaxed font-bold">
                سامانه هوشمند مدیریت زنجیره تامین و ثبت سفارشات مبلمان
              </p>
              <div className="flex gap-4 mt-8">
                 <button onClick={() => handleViewChange('supplier')} className="px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-xl transition-all shadow-lg font-black border-b-4 border-gray-700">ورود به پنل مدیریت (تولیدی)</button>
                 <button onClick={() => handleViewChange('store')} className="px-6 py-3 bg-primary text-white hover:bg-yellow-700 rounded-xl transition-all shadow-lg font-black border-b-4 border-yellow-800">ورود به پنل فروشگاه (نمایشگاه)</button>
              </div>
            </div>
          );
      }

      if (!isAuthenticated) {
          return <Login type={currentView === 'supplier' ? 'supplier' : 'store'} onLogin={handleLogin} error={loginError} logo={appLogo} />;
      }

      if (currentView === 'supplier') {
          return (
            <SupplierPanel 
                stores={stores} 
                orders={orders}
                categories={categories}
                items={items}
                logo={appLogo}
                onLogoUpload={setAppLogo}
                onAddStore={handleAddStore} 
                onDeleteStore={handleDeleteStore}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onToggleCategory={handleToggleCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdateOrderDetails={handleUpdateOrderDetails}
            />
          );
      }

      if (currentView === 'store') {
          return (
            <StorePanel 
                currentStore={currentUser!} 
                categories={categories}
                items={items}
                myOrders={orders.filter(o => o.storeId === currentUser?.id)}
                onPlaceOrder={handlePlaceOrder} 
                onUpdateOrderDetails={handleUpdateOrderDetails}
            />
          );
      }
      return null;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-right selection:bg-primary selection:text-white">
      <Header logo={appLogo} />
      <div className="flex flex-col md:flex-row flex-1">
        <main className="flex-1 order-2 md:order-1 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {renderContent()}
        </main>
        <div className="order-1 md:order-2">
            <Sidebar currentView={currentView} onChangeView={handleViewChange} />
        </div>
      </div>
    </div>
  );
};

export default App;