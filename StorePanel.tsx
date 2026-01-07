import React, { useState, useEffect } from 'react';
import { StoreAccount, Order, ModelCategory, ModelItem, OrderLine } from '../types';
import { Store, Calendar, User, Phone, Send, Search, Plus, Trash2, Armchair, ShoppingCart, List, MapPin, Clock, Edit2, Check, X, Minus, Palette, FileText, RefreshCw, MessageSquare, Timer, BarChart3, Filter, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { getPersianDate } from '../services/dateService';

interface StorePanelProps {
    currentStore: StoreAccount;
    categories: ModelCategory[];
    items: ModelItem[];
    myOrders: Order[];
    onPlaceOrder: (order: Order) => void;
    onUpdateOrderDetails: (order: Order) => void;
}

const StorePanel: React.FC<StorePanelProps> = ({ currentStore, categories, items, myOrders, onPlaceOrder, onUpdateOrderDetails }) => {
  const [activeTab, setActiveTab] = useState<'new_order' | 'history' | 'reports'>('new_order');
  
  // Timer State for live countdown
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // New Order State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderDescription, setOrderDescription] = useState(''); // New General Description
  const [cartLines, setCartLines] = useState<OrderLine[]>([]);
  
  // Editing State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  // Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [itemColor, setItemColor] = useState('');
  const [itemDescription, setItemDescription] = useState('');

  // Reporting State
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSortBy, setReportSortBy] = useState<'date' | 'amount'>('date');
  const [reportType, setReportType] = useState<'sales' | 'products'>('sales');

  const activeCategories = categories.filter(c => c.isActive);
  const activeItems = items.filter(i => i.isActive && i.categoryId === selectedCategoryId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedItem = items.find(i => i.id === selectedItemId);

  // --- HELPER: TIME REMAINING ---
  const getRemainingTime = (timestamp: number) => {
      const diff = 5 * 60 * 1000 - (now - timestamp);
      if (diff <= 0) return null;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- DATE FORMATTER ---
  const handleDateInput = (val: string, setter: (v: string) => void) => {
      let cleanVal = val.replace(/\D/g, '');
      if (cleanVal.length >= 5) {
          cleanVal = cleanVal.slice(0, 4) + '/' + cleanVal.slice(4);
      }
      if (cleanVal.length >= 8) {
          cleanVal = cleanVal.slice(0, 7) + '/' + cleanVal.slice(7);
      }
      if (cleanVal.length > 10) cleanVal = cleanVal.slice(0, 10);
      setter(cleanVal);
  };

  const addToCart = () => {
      if (!selectedCategory || !selectedItem || qty < 1) return;
      
      const newItem: OrderLine = {
          id: `line_${Date.now()}`,
          categorySnapshot: selectedCategory.name,
          itemSnapshot: selectedItem.name,
          itemId: selectedItem.id,
          unitPriceSnapshot: selectedItem.basePrice,
          quantity: qty,
          lineTotal: selectedItem.basePrice * qty,
          color: itemColor,
          description: itemDescription
      };
      
      setCartLines([...cartLines, newItem]);
      setSelectedItemId('');
      setQty(1);
      setItemColor('');
      setItemDescription('');
  };

  const updateCartQuantity = (lineId: string, change: number) => {
      setCartLines(prev => prev.map(line => {
          if (line.id === lineId) {
              const newQty = Math.max(1, line.quantity + change);
              return {
                  ...line,
                  quantity: newQty,
                  lineTotal: line.unitPriceSnapshot * newQty
              };
          }
          return line;
      }));
  };

  const removeFromCart = (lineId: string) => {
      setCartLines(cartLines.filter(l => l.id !== lineId));
  };

  const calculateTotal = () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (cartLines.length === 0) return alert('سبد خرید خالی است.');

      if (editingOrderId) {
          // Update Existing Order
          const originalOrder = myOrders.find(o => o.id === editingOrderId);
          if (!originalOrder) return;

          // Check time again
          const minsDiff = (Date.now() - originalOrder.timestamp) / 1000 / 60;
          if (minsDiff > 5) {
              alert("مهلت ویرایش (۵ دقیقه) به پایان رسیده است.");
              setEditingOrderId(null);
              resetForm();
              return;
          }

          const updatedOrder: Order = {
              ...originalOrder,
              customerName,
              customerPhone,
              deliveryAddress,
              deliveryDate,
              orderDescription,
              lines: cartLines,
              totalPriceSnapshot: calculateTotal(),
              // Keep original timestamp/createdAt
          };
          onUpdateOrderDetails(updatedOrder);
          alert('سفارش با موفقیت ویرایش شد.');
      } else {
          // Create New Order
          // Generate a 6-digit order ID for simulation
          const randomId = Math.floor(100000 + Math.random() * 900000).toString();
          
          const newOrder: Order = {
              id: randomId,
              storeId: currentStore.id,
              storeName: currentStore.name,
              customerName,
              customerPhone,
              deliveryAddress,
              deliveryDate,
              orderDescription,
              status: 'NEW',
              lines: cartLines,
              totalPriceSnapshot: calculateTotal(),
              createdAt: getPersianDate(),
              timestamp: Date.now()
          };
          onPlaceOrder(newOrder);
      }

      resetForm();
      setActiveTab('history');
  };

  const resetForm = () => {
      setEditingOrderId(null);
      setCartLines([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setDeliveryDate('');
      setOrderDescription('');
      setQty(1);
      setItemColor('');
      setItemDescription('');
      setSelectedCategoryId('');
      setSelectedItemId('');
  };

  // --- EDIT HANDLERS ---
  const startEditing = (order: Order) => {
      const minsDiff = (Date.now() - order.timestamp) / 1000 / 60;
      if (minsDiff > 5) {
          alert("مهلت ویرایش (۵ دقیقه) به پایان رسیده است.");
          return;
      }

      setCustomerName(order.customerName);
      setCustomerPhone(order.customerPhone);
      setDeliveryAddress(order.deliveryAddress);
      setDeliveryDate(order.deliveryDate);
      setOrderDescription(order.orderDescription || '');
      setCartLines([...order.lines]); // Clone lines
      setEditingOrderId(order.id);
      setActiveTab('new_order');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- REPORT GENERATION HELPER ---
  const getFilteredOrders = () => {
      return myOrders.filter(o => {
          // Date Filter
          let matchesDate = true;
          if (reportStartDate) {
              matchesDate = matchesDate && o.timestamp >= new Date(reportStartDate).getTime();
          }
          if (reportEndDate) {
              // End of the selected day
              const end = new Date(reportEndDate);
              end.setHours(23, 59, 59, 999);
              matchesDate = matchesDate && o.timestamp <= end.getTime();
          }
          return matchesDate;
      });
  };

  const getProductStats = (filteredOrders: Order[]) => {
      const stats: Record<string, { name: string, quantity: number, total: number }> = {};
      
      filteredOrders.forEach(order => {
          order.lines.forEach(line => {
              if (!stats[line.itemId]) {
                  stats[line.itemId] = {
                      name: `${line.categorySnapshot} - ${line.itemSnapshot}`,
                      quantity: 0,
                      total: 0
                  };
              }
              stats[line.itemId].quantity += line.quantity;
              stats[line.itemId].total += line.lineTotal;
          });
      });

      return Object.values(stats).sort((a, b) => 
        reportSortBy === 'amount' ? b.total - a.total : b.quantity - a.quantity
      );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header & Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-black p-6 text-white flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl"><Store size={24}/></div>
                <h2 className="text-xl font-black">{currentStore.name}</h2>
             </div>
             <div className="flex bg-gray-800 p-1 rounded-xl">
                 <button onClick={() => setActiveTab('new_order')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new_order' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                    {editingOrderId ? 'ویرایش سفارش' : 'ثبت سفارش جدید'}
                 </button>
                 <button onClick={() => { resetForm(); setActiveTab('history'); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>تاریخچه سفارشات</button>
                 <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-primary text-white shadow' : 'text-gray-400'}`}>
                    <BarChart3 size={14}/> گزارشات مالی
                 </button>
             </div>
        </div>
      </div>

      {activeTab === 'new_order' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                  {/* Edit Mode Banner */}
                  {editingOrderId && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center animate-pulse">
                          <div className="flex items-center gap-2 text-amber-700 font-bold">
                              <Edit2 size={20} />
                              <span>در حال ویرایش سفارش شماره {editingOrderId.slice(-6)}</span>
                          </div>
                          <button onClick={resetForm} className="text-sm bg-white border border-amber-200 px-3 py-1 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors font-bold">
                              انصراف
                          </button>
                      </div>
                  )}

                  {/* Customer Info */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-black text-gray-800 mb-4 border-b pb-2">۱. مشخصات خریدار</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <User className="absolute right-3 top-3 text-gray-400" size={18} />
                            <input type="text" placeholder="نام خریدار" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" />
                          </div>
                          <div className="relative">
                            <Phone className="absolute right-3 top-3 text-gray-400" size={18} />
                            <input type="tel" placeholder="شماره تماس" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" />
                          </div>
                          <div className="relative md:col-span-2">
                             <MapPin className="absolute right-3 top-3 text-gray-400" size={18} />
                             <input type="text" placeholder="آدرس محل تحویل" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" />
                          </div>
                          <div className="relative">
                             <label className="text-xs text-gray-500 mb-1 block mr-1 font-bold">تاریخ ثبت سفارش</label>
                             <div className="w-full bg-gray-100 border border-gray-200 p-3 rounded-xl text-gray-500 font-bold cursor-not-allowed select-none">
                                {editingOrderId ? (myOrders.find(o => o.id === editingOrderId)?.createdAt || getPersianDate()) : getPersianDate()}
                             </div>
                          </div>
                          <div className="relative">
                             <label className="text-xs text-gray-500 mb-1 block mr-1 font-bold">تاریخ تحویل درخواستی</label>
                             <input 
                                type="text" 
                                dir="ltr"
                                placeholder="1403/MM/DD" 
                                value={deliveryDate} 
                                onChange={e => handleDateInput(e.target.value, setDeliveryDate)} 
                                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800 text-center tracking-widest placeholder:tracking-normal" 
                             />
                          </div>
                          {/* General Order Description */}
                          <div className="relative md:col-span-2">
                             <MessageSquare className="absolute right-3 top-3 text-gray-400" size={18} />
                             <input 
                                type="text" 
                                placeholder="توضیحات کلی سفارش (اختیاری)" 
                                value={orderDescription} 
                                onChange={e => setOrderDescription(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" 
                             />
                          </div>
                      </div>
                  </div>

                  {/* Product Selection */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <h3 className="font-black text-gray-800 mb-4 border-b pb-2">۲. انتخاب محصول</h3>
                      <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">انتخاب مدل (Category)</label>
                                  <select 
                                      value={selectedCategoryId} 
                                      onChange={e => { setSelectedCategoryId(e.target.value); setSelectedItemId(''); }}
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
                                  >
                                      <option value="">-- انتخاب مدل --</option>
                                      {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">انتخاب کالا (Item)</label>
                                  <select 
                                      value={selectedItemId} 
                                      onChange={e => setSelectedItemId(e.target.value)}
                                      disabled={!selectedCategoryId}
                                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold disabled:opacity-50 text-gray-800"
                                  >
                                      <option value="">-- انتخاب کالا --</option>
                                      {activeItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.basePrice.toLocaleString()} تومان)</option>)}
                                  </select>
                              </div>
                          </div>

                          {/* New Fields: Color and Description */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="relative">
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">کد رنگ چوب</label>
                                  <Palette className="absolute right-3 top-9 text-gray-400" size={18} />
                                  <input 
                                    type="text" 
                                    placeholder="مثلاً: گردویی تیره" 
                                    value={itemColor} 
                                    onChange={e => setItemColor(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" 
                                  />
                              </div>
                              <div className="relative">
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">توضیحات آیتم</label>
                                  <FileText className="absolute right-3 top-9 text-gray-400" size={18} />
                                  <input 
                                    type="text" 
                                    placeholder="مثلاً: پارچه نانو" 
                                    value={itemDescription} 
                                    onChange={e => setItemDescription(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-bold text-gray-800" 
                                  />
                              </div>
                          </div>
                          
                          <div className="flex items-end gap-4">
                              <div className="w-24">
                                  <label className="text-xs font-bold text-gray-500 mb-1 block">تعداد</label>
                                  <input type="number" min="1" value={qty} onChange={e => setQty(parseInt(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-center text-gray-800" />
                              </div>
                              <button 
                                  onClick={addToCart}
                                  disabled={!selectedItem}
                                  className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:shadow-none"
                              >
                                  افزودن به لیست سفارش
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Cart Section */}
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-full flex flex-col">
                      <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2"><ShoppingCart className="text-primary"/> سبد سفارش</h3>
                      
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          {cartLines.length === 0 ? (
                              <div className="text-center text-gray-400 py-10 text-sm">لیست خالی است</div>
                          ) : (
                              cartLines.map(line => (
                                  <div key={line.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                                      <div className="text-xs text-primary font-bold mb-1">{line.categorySnapshot}</div>
                                      <div className="font-bold text-gray-800 text-sm mb-1">{line.itemSnapshot}</div>
                                      {(line.color || line.description) && (
                                          <div className="text-xs text-gray-500 mb-2 border-t border-gray-200 pt-1 mt-1">
                                              {line.color && <span className="ml-2">کد رنگ چوب: {line.color}</span>}
                                              {line.description && <span>({line.description})</span>}
                                          </div>
                                      )}
                                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-1">
                                              <button onClick={() => updateCartQuantity(line.id, 1)} className="p-1 hover:text-primary"><Plus size={14}/></button>
                                              <span className="font-black text-gray-800 w-4 text-center">{line.quantity}</span>
                                              <button onClick={() => updateCartQuantity(line.id, -1)} className="p-1 hover:text-red-500"><Minus size={14}/></button>
                                          </div>
                                          <div className="flex flex-col items-end">
                                             <span className="text-[10px] text-gray-400">فی: {line.unitPriceSnapshot.toLocaleString()}</span>
                                             <span className="font-mono font-bold text-gray-700">{line.lineTotal.toLocaleString()}</span>
                                          </div>
                                      </div>
                                      <button onClick={() => removeFromCart(line.id)} className="absolute top-2 left-2 text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm transition-opacity"><Trash2 size={16}/></button>
                                  </div>
                              ))
                          )}
                      </div>

                      <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-gray-500 font-bold">جمع کل:</span>
                              <span className="text-xl font-black text-primary">{calculateTotal().toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                          </div>
                          <button onClick={handleSubmit} disabled={cartLines.length === 0} className={`w-full py-3 rounded-xl font-black transition-all disabled:opacity-50 ${editingOrderId ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-black text-white hover:bg-gray-800'}`}>
                              {editingOrderId ? 'بروزرسانی سفارش' : 'ثبت نهایی سفارش'}
                          </button>
                          {editingOrderId && (
                              <button onClick={resetForm} className="w-full mt-2 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
                                  انصراف از ویرایش
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'history' && (
          <div className="space-y-4">
              {myOrders.length === 0 ? (
                  <div className="text-center text-gray-400 py-20 font-bold">هنوز سفارشی ثبت نکرده‌اید.</div>
              ) : (
                  myOrders.map(order => {
                      const remainingTime = getRemainingTime(order.timestamp);
                      const isEditable = remainingTime !== null;
                      
                      return (
                          <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                              {/* Status Border */}
                              {isEditable && editingOrderId !== order.id && (
                                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100">
                                      <div className="h-full bg-emerald-500 animate-pulse w-full"></div>
                                  </div>
                              )}

                              <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-4 gap-4">
                                  <div>
                                      <div className="text-xs text-gray-400 font-bold mb-1 flex items-center gap-2">
                                          شماره سفارش: {order.id.slice(-6)}
                                          {editingOrderId !== order.id && (
                                              isEditable ? (
                                                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold">
                                                      <Timer size={10} className="animate-pulse"/> 
                                                      قابل ویرایش ({remainingTime})
                                                  </span>
                                              ) : (
                                                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold">
                                                      <X size={10}/> 
                                                      پایان زمان ویرایش
                                                  </span>
                                              )
                                          )}
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="font-black text-lg text-gray-800">{order.customerName}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12}/> {order.customerPhone}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12}/> {order.deliveryAddress || 'آدرس ثبت نشده'}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-1"><Calendar size={12}/> تحویل: {order.deliveryDate || '-'}</div>
                                        {order.orderDescription && (
                                            <div className="text-sm text-gray-600 flex items-start gap-1 mt-1 bg-gray-50 p-1 rounded">
                                                <MessageSquare size={12} className="mt-1 flex-shrink-0"/> 
                                                <span>توضیحات: {order.orderDescription}</span>
                                            </div>
                                        )}
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                      <div className="flex items-center gap-4">
                                          <div className="text-right">
                                              <div className="text-xs text-gray-400 font-bold">وضعیت</div>
                                              <div className="font-bold text-primary">{order.status}</div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-xs text-gray-400 font-bold">مبلغ کل</div>
                                              <div className="font-black text-xl">{order.totalPriceSnapshot.toLocaleString()}</div>
                                          </div>
                                      </div>
                                      
                                      {/* Edit Button Logic */}
                                      {isEditable && editingOrderId !== order.id ? (
                                          <button onClick={() => startEditing(order)} className="text-sm bg-white border border-emerald-500 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors font-bold flex items-center gap-1">
                                              <Edit2 size={14} /> ویرایش سفارش
                                          </button>
                                      ) : (!isEditable && editingOrderId !== order.id && (
                                          <button disabled className="text-sm bg-gray-50 border border-gray-200 text-gray-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-not-allowed">
                                              <Edit2 size={14} /> ویرایش مسدود شد
                                          </button>
                                      ))}

                                      {editingOrderId === order.id && (
                                          <span className="text-amber-600 font-bold text-sm bg-amber-50 px-2 py-1 rounded">در حال ویرایش...</span>
                                      )}
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {order.lines.map((line, i) => (
                                      <div key={i} className="bg-gray-50 px-3 py-2 rounded-lg text-sm border border-gray-100 flex flex-col justify-between">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-gray-700 font-bold">{line.categorySnapshot} - {line.itemSnapshot}</span>
                                            <span className="text-gray-500">x{line.quantity}</span>
                                          </div>
                                          {(line.color || line.description) && (
                                              <div className="text-[10px] text-gray-500 flex gap-2 border-t border-gray-200 pt-1">
                                                 {line.color && <span className="bg-white px-1 rounded border border-gray-200">کد رنگ: {line.color}</span>}
                                                 {line.description && <span className="bg-white px-1 rounded border border-gray-200">توضیح: {line.description}</span>}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      )}

      {/* --- REPORTS TAB (STORE) --- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Date Filters */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon size={12}/> تاریخ شروع</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><CalendarIcon size={12}/> تاریخ پایان</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                        />
                    </div>
                    
                    {/* Report Type */}
                    <div className="flex-1 min-w-[150px]">
                         <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Filter size={12}/> نوع گزارش</label>
                         <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
                             <button onClick={() => setReportType('sales')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${reportType === 'sales' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>لیست فروش</button>
                             <button onClick={() => setReportType('products')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${reportType === 'products' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>آمار کالا</button>
                         </div>
                    </div>

                    {/* Sort */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><TrendingUp size={12}/> مرتب‌سازی</label>
                        <select 
                            value={reportSortBy} 
                            onChange={(e) => setReportSortBy(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none text-gray-800"
                        >
                            <option value="date">بر اساس تاریخ</option>
                            <option value="amount">بر اساس مبلغ</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                {(() => {
                    let filtered = getFilteredOrders();
                    
                    if (reportSortBy === 'amount') {
                        filtered.sort((a, b) => b.totalPriceSnapshot - a.totalPriceSnapshot);
                    } else {
                        filtered.sort((a, b) => b.timestamp - a.timestamp);
                    }

                    const totalAmount = filtered.reduce((sum, o) => sum + o.totalPriceSnapshot, 0);

                    if (reportType === 'sales') {
                        return (
                            <>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                    <div className="font-black text-gray-800">تعداد سفارشات: {filtered.length}</div>
                                    <div className="font-black text-xl text-primary">جمع کل: {totalAmount.toLocaleString('fa-IR')} تومان</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
                                            <tr>
                                                <th className="p-3 rounded-r-xl">تاریخ</th>
                                                <th className="p-3">مشتری</th>
                                                <th className="p-3">تلفن</th>
                                                <th className="p-3">مبلغ (تومان)</th>
                                                <th className="p-3 rounded-l-xl">وضعیت</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filtered.map(o => (
                                                <tr key={o.id}>
                                                    <td className="p-3 font-mono text-xs">{o.createdAt}</td>
                                                    <td className="p-3 font-bold text-gray-700">{o.customerName}</td>
                                                    <td className="p-3 text-gray-600">{o.customerPhone}</td>
                                                    <td className="p-3 font-black">{o.totalPriceSnapshot.toLocaleString('fa-IR')}</td>
                                                    <td className="p-3 font-bold text-xs">{o.status}</td>
                                                </tr>
                                            ))}
                                            {filtered.length === 0 && <tr><td colSpan={5} className="text-center p-8 text-gray-400">موردی یافت نشد</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        );
                    } else {
                        // Product Stats
                        const productStats = getProductStats(filtered);
                        return (
                            <>
                                 <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                    <div className="font-black text-gray-800">تنوع کالای فروخته شده: {productStats.length}</div>
                                    <div className="font-black text-xl text-primary">جمع خرید بازه: {totalAmount.toLocaleString('fa-IR')} تومان</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
                                            <tr>
                                                <th className="p-3 rounded-r-xl">#</th>
                                                <th className="p-3">نام کالا</th>
                                                <th className="p-3">تعداد خرید</th>
                                                <th className="p-3 rounded-l-xl">مبلغ کل (تومان)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {productStats.map((stat, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3 text-gray-400">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-gray-700">{stat.name}</td>
                                                    <td className="p-3 font-mono font-bold text-blue-600">{stat.quantity}</td>
                                                    <td className="p-3 font-black">{stat.total.toLocaleString('fa-IR')}</td>
                                                </tr>
                                            ))}
                                            {productStats.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-gray-400">موردی یافت نشد</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        );
                    }
                })()}
            </div>
        </div>
      )}
    </div>
  );
};

export default StorePanel;