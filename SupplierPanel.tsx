import React, { useState, useEffect } from 'react';
import { Order, StoreAccount, ModelCategory, ModelItem, OrderStatus } from '../types';
import { 
  Loader2, Store, Plus, User, Trash2, Pencil, 
  Armchair, Sofa, Eye, EyeOff, Layers, ChevronDown, ChevronUp, 
  CheckCircle2, TrendingUp, Box, FilePlus, ListPlus, ShoppingBag, Clock, Check, Truck, X,
  AlertTriangle, Square, CheckSquare, Printer, MapPin, Phone, Upload, Timer, BarChart3, Calendar as CalendarIcon, Filter
} from 'lucide-react';

interface SupplierPanelProps {
  stores: StoreAccount[];
  orders: Order[];
  categories: ModelCategory[];
  items: ModelItem[];
  logo?: string | null;
  onLogoUpload?: (logo: string) => void;
  onAddStore: (store: StoreAccount) => void;
  onDeleteStore: (id: string) => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onToggleCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddItem: (item: ModelItem) => void;
  onUpdateItem: (item: ModelItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateOrderDetails: (order: Order) => void;
}

const SupplierPanel: React.FC<SupplierPanelProps> = ({ 
    stores, orders, categories, items, logo, onLogoUpload,
    onAddStore, onDeleteStore,
    onAddCategory, onUpdateCategory, onToggleCategory, onDeleteCategory,
    onAddItem, onUpdateItem, onDeleteItem,
    onUpdateOrderStatus, onUpdateOrderDetails
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'models' | 'stores' | 'reports'>('orders');
  
  // Live Timer State
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Model Management State
  const [newModelName, setNewModelName] = useState('');
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});
  const [batchInput, setBatchInput] = useState<Record<string, string>>({}); 
  
  // Category Editing State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Order Editing State (Admin)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrderData, setEditOrderData] = useState<Partial<Order>>({});

  // Multi-Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Store Management State
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreUser, setNewStoreUser] = useState('');
  const [newStorePass, setNewStorePass] = useState('');
  
  // Reporting State
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSelectedStoreIds, setReportSelectedStoreIds] = useState<string[]>([]); // Empty = All
  const [reportSortBy, setReportSortBy] = useState<'date' | 'amount'>('date');
  const [reportType, setReportType] = useState<'sales' | 'products'>('sales');

  // Custom Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'store' | 'category' | 'item' | 'bulk_items';
    id?: string; // For single actions
    ids?: string[]; // For bulk actions
    name?: string; // Display name or count description
  } | null>(null);

  const toggleModel = (id: string) => setExpandedModels(prev => ({ ...prev, [id]: !prev[id] }));

  // --- LOGO UPLOAD ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onLogoUpload) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- MODEL HANDLERS ---
  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;
    onAddCategory(newModelName.trim());
    setNewModelName('');
  };

  const startEditingCategory = (e: React.MouseEvent, cat: ModelCategory) => {
      e.stopPropagation();
      setEditingCategoryId(cat.id);
      setEditingCategoryName(cat.name);
  };

  const saveEditingCategory = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingCategoryId && editingCategoryName.trim()) {
          onUpdateCategory(editingCategoryId, editingCategoryName.trim());
          setEditingCategoryId(null);
      }
  };

  const cancelEditingCategory = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingCategoryId(null);
  };

  const handleBatchAddItems = (categoryId: string) => {
    const input = batchInput[categoryId] || '';
    const lines = input.split('\n').map(l => l.trim()).filter(l => l);
    
    // Find the category to append its name
    const category = categories.find(c => c.id === categoryId);
    const categorySuffix = category ? ` ${category.name}` : '';

    lines.forEach((name, idx) => {
       // Combine item name with category name
       const finalName = `${name}${categorySuffix}`;

       onAddItem({
           id: `item_${Date.now()}_${idx}`,
           categoryId,
           name: finalName,
           basePrice: 0,
           isActive: true
       });
    });
    setBatchInput(prev => ({ ...prev, [categoryId]: '' }));
  };

  // --- PRICE INPUT HANDLERS ---
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, item: ModelItem) => {
      const rawValue = e.target.value.replace(/,/g, '');
      const numericValue = parseInt(rawValue) || 0;
      onUpdateItem({ ...item, basePrice: numericValue });
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const allInputs = Array.from(document.querySelectorAll('.price-input-field'));
          const currentIndex = allInputs.indexOf(e.currentTarget);
          
          if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
              (allInputs[currentIndex + 1] as HTMLInputElement).focus();
          }
      }
  };

  // --- DATE HANDLER ---
  const handleDateInput = (val: string, setter: (v: string) => void) => {
      let cleanVal = val.replace(/\D/g, '');
      if (cleanVal.length >= 5) cleanVal = cleanVal.slice(0, 4) + '/' + cleanVal.slice(4);
      if (cleanVal.length >= 8) cleanVal = cleanVal.slice(0, 7) + '/' + cleanVal.slice(7);
      if (cleanVal.length > 10) cleanVal = cleanVal.slice(0, 10);
      setter(cleanVal);
  };

  // --- ADMIN ORDER EDITING ---
  const startEditingOrder = (order: Order) => {
      setEditingOrderId(order.id);
      setEditOrderData({
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
          deliveryDate: order.deliveryDate
      });
  };

  const saveEditingOrder = () => {
      if (!editingOrderId) return;
      const originalOrder = orders.find(o => o.id === editingOrderId);
      if (originalOrder) {
          onUpdateOrderDetails({
              ...originalOrder,
              ...editOrderData
          });
      }
      setEditingOrderId(null);
      setEditOrderData({});
  };

  // --- HELPER: TIME REMAINING ---
  const getRemainingTimeMs = (timestamp: number) => {
      return 5 * 60 * 1000 - (now - timestamp);
  };
  
  const formatTime = (ms: number) => {
      if (ms <= 0) return "00:00";
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- PRINT HANDLER ---
  const handlePrintOrder = (order: Order) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const logoHtml = logo ? `<img src="${logo}" style="position: absolute; left: 50%; transform: translateX(-50%); top: 5px; max-height: 40px; width: auto;" />` : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <title>سفارش ${order.id}</title>
            <style>
                /* Set Page to A4 Portrait */
                @page { 
                    size: A4 portrait; 
                    margin: 0; 
                }
                * { box-sizing: border-box; }
                body { 
                    font-family: 'Tahoma', 'Segoe UI', Arial, sans-serif; 
                    margin: 0; 
                    padding: 10mm; 
                    direction: rtl; 
                    font-size: 11px; 
                    width: 210mm;
                    height: 297mm;
                }
                
                /* The visible frame (Top Half of A4) */
                .print-frame {
                    width: 190mm; 
                    height: 138mm; 
                    border: 2px solid #000;
                    border-radius: 8px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    margin: 0 auto;
                    position: relative;
                }

                .header { 
                    height: 50px;
                    border-bottom: 2px solid #000; 
                    margin-bottom: 5px; 
                    flex-shrink: 0; 
                    position: relative;
                }
                .order-id {
                    position: absolute;
                    right: 0;
                    top: 15px;
                    font-weight: 900;
                    font-size: 14px;
                }
                
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1px 10px; 
                    margin-bottom: 4px; 
                    border: 1px solid #aaa; 
                    padding: 4px; 
                    border-radius: 4px; 
                    background: #fcfcfc; 
                    flex-shrink: 0; 
                    font-size: 10px; 
                }
                .info-item { display: flex; gap: 4px; align-items: baseline; }
                .label { font-weight: bold; color: #000; flex-shrink: 0; }
                span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .table-container { flex-grow: 1; display: flex; flex-direction: column; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2px; font-size: 11px; }
                thead { display: table-header-group; }
                tr { height: 25px; } 
                th, td { border: 1px solid #000; padding: 0 4px; text-align: center; vertical-align: middle; }
                th { background-color: #eee; font-weight: bold; font-size: 10px; height: 22px; }
                .item-name { text-align: right; font-weight: bold; font-size: 11px; white-space: nowrap; overflow: hidden; max-width: 250px; text-overflow: ellipsis;}
                
                .description-box {
                    border: 1px solid #000;
                    border-radius: 4px;
                    padding: 5px;
                    margin: 0 0 2px 0; /* Reduced margins to save space */
                    background: #fff;
                    font-size: 11px;
                    min-height: 25px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: flex-start;
                    gap: 5px;
                }

                .total { 
                    text-align: left; 
                    font-weight: 900; 
                    font-size: 16px; 
                    margin-top: 2px; /* Minimal space above total */
                    border-top: 2px solid #000; 
                    padding-top: 4px; 
                    flex-shrink: 0; 
                    background: #f0f0f0; 
                    padding: 6px; 
                    border-radius: 4px; 
                }
                .footer { margin-top: 2px; text-align: center; font-size: 9px; color: #555; flex-shrink: 0; }
                
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="print-frame">
                <div class="header">
                    <div class="order-id">شماره: ${order.id}</div>
                    ${logoHtml}
                </div>
                
                <div class="info-grid">
                    <div class="info-item"><span class="label">فروشگاه:</span> <span>${order.storeName}</span></div>
                    <div class="info-item"><span class="label">نام مشتری:</span> <span>${order.customerName}</span></div>
                    <div class="info-item"><span class="label">تلفن مشتری:</span> <span>${order.customerPhone}</span></div>
                    <div class="info-item"><span class="label">تاریخ ثبت:</span> <span>${order.createdAt}</span></div>
                    <div class="info-item"><span class="label">تاریخ تحویل:</span> <span style="direction: ltr; display: inline-block;">${order.deliveryDate || '-'}</span></div>
                    <div class="info-item"><span class="label">آدرس تحویل:</span> <span style="white-space: normal; font-size: 10px;">${order.deliveryAddress || '-'}</span></div>
                </div>

                <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">#</th>
                            <th>شرح کالا</th>
                            <th style="width: 15%">کد رنگ چوب</th>
                            <th style="width: 15%">توضیحات</th>
                            <th style="width: 8%">تعداد</th>
                            <th style="width: 14%">فی (تومان)</th>
                            <th style="width: 14%">کل (تومان)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.lines.map((line, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td class="item-name">${line.categorySnapshot} - ${line.itemSnapshot}</td>
                                <td>${line.color || '-'}</td>
                                <td>${line.description || '-'}</td>
                                <td>${line.quantity}</td>
                                <td>${line.unitPriceSnapshot.toLocaleString('fa-IR')}</td>
                                <td>${line.lineTotal.toLocaleString('fa-IR')}</td>
                            </tr>
                        `).join('')}
                        ${/* Fill empty rows if less than 10 to maintain layout size */ 
                        Array.from({ length: Math.max(0, 10 - order.lines.length) }).map((_, i) => `
                            <tr>
                                <td>${order.lines.length + i + 1}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                </div>

                <div class="description-box">
                   <span class="label">توضیحات:</span>
                   <span style="font-weight: bold;">${order.orderDescription || '-'}</span>
                </div>

                <div class="total">
                    جمع کل: ${order.totalPriceSnapshot.toLocaleString('fa-IR')} تومان
                </div>
                
                <div class="footer">
                    چاپ سیستمی - ${new Date().toLocaleDateString('fa-IR')}
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  // --- SELECTION HANDLERS ---
  const toggleItemSelection = (itemId: string) => {
      setSelectedItemIds(prev => 
          prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
      );
  };

  const toggleCategorySelection = (categoryItems: ModelItem[]) => {
      const allIds = categoryItems.map(i => i.id);
      const allSelected = allIds.every(id => selectedItemIds.includes(id));

      if (allSelected) {
          // Deselect all in this category
          setSelectedItemIds(prev => prev.filter(id => !allIds.includes(id)));
      } else {
          // Select all in this category (merge unique)
          setSelectedItemIds(prev => [...new Set([...prev, ...allIds])]);
      }
  };

  const handleBulkVisibility = (makeActive: boolean) => {
      selectedItemIds.forEach(id => {
          const item = items.find(i => i.id === id);
          if (item) {
              onUpdateItem({ ...item, isActive: makeActive });
          }
      });
      setSelectedItemIds([]); // Clear selection after action
  };

  // --- DELETE HANDLERS ---
  const requestDeleteCategory = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation(); 
      setDeleteConfirm({ isOpen: true, type: 'category', id, name });
  };

  const requestDeleteItem = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      setDeleteConfirm({ isOpen: true, type: 'item', id, name });
  };

  const requestDeleteStore = (id: string, name: string) => {
      setDeleteConfirm({ isOpen: true, type: 'store', id, name });
  };

  const requestBulkDelete = () => {
      if (selectedItemIds.length === 0) return;
      setDeleteConfirm({
          isOpen: true,
          type: 'bulk_items',
          ids: selectedItemIds,
          name: `${selectedItemIds.length} مورد انتخاب شده`
      });
  };

  const confirmDeleteAction = () => {
      if (!deleteConfirm) return;
      const { type, id, ids } = deleteConfirm;
      if (type === 'store' && id) onDeleteStore(id);
      if (type === 'category' && id) onDeleteCategory(id);
      if (type === 'item' && id) onDeleteItem(id);
      if (type === 'bulk_items' && ids) {
          ids.forEach(itemId => onDeleteItem(itemId));
          setSelectedItemIds([]);
      }
      setDeleteConfirm(null);
  };

  // --- REPORT GENERATION HELPER ---
  const getFilteredOrders = () => {
      return orders.filter(o => {
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

          // Store Filter
          let matchesStore = true;
          if (reportSelectedStoreIds.length > 0) {
              matchesStore = reportSelectedStoreIds.includes(o.storeId);
          }

          return matchesDate && matchesStore;
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

  // --- HELPERS ---
  const getStatusBadge = (status: OrderStatus) => {
      const styles = {
          'NEW': 'bg-blue-100 text-blue-700',
          'CONFIRMED': 'bg-indigo-100 text-indigo-700',
          'IN_PRODUCTION': 'bg-amber-100 text-amber-700',
          'READY': 'bg-emerald-100 text-emerald-700',
          'DELIVERED': 'bg-slate-200 text-slate-600',
          'CANCELED': 'bg-red-100 text-red-700',
      };
      const labels = {
          'NEW': 'جدید',
          'CONFIRMED': 'تایید شده',
          'IN_PRODUCTION': 'در حال تولید',
          'READY': 'آماده تحویل',
          'DELIVERED': 'تحویل شده',
          'CANCELED': 'لغو شده'
      };
      return <span className={`px-2 py-1 rounded-lg text-xs font-black ${styles[status]}`}>{labels[status]}</span>;
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddStore({
        id: editingStoreId || Date.now().toString(),
        name: newStoreName,
        username: newStoreUser,
        password: newStorePass,
        ownerName: '', ownerLastName: '', phone: '', address: '', isActive: true
      });
      setNewStoreName(''); setNewStoreUser(''); setNewStorePass(''); setEditingStoreId(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn relative pb-24">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h2 className="text-2xl font-black text-black flex items-center gap-2">
                <Armchair className="text-primary" />
                پنل مدیریت (Admin)
            </h2>
        </div>
        
        {/* Logo Upload Section */}
        <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-black px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-gray-200">
                <Upload size={16} className="text-primary"/>
                {logo ? 'تغییر لوگو' : 'آپلود لوگو'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>سفارشات</button>
          <button onClick={() => setActiveTab('models')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'models' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>مدیریت مدل‌ها</button>
          <button onClick={() => setActiveTab('stores')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'stores' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>فروشگاه‌ها</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}>
             <BarChart3 size={16}/> گزارشات
          </button>
        </div>
      </div>

      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-400 text-xs font-bold">سفارشات جدید</div>
                      <div className="text-2xl font-black text-blue-600 mt-1">{orders.filter(o => o.status === 'NEW').length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-400 text-xs font-bold">در حال تولید</div>
                      <div className="text-2xl font-black text-amber-500 mt-1">{orders.filter(o => o.status === 'IN_PRODUCTION').length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-400 text-xs font-bold">آماده تحویل</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{orders.filter(o => o.status === 'READY').length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="text-gray-400 text-xs font-bold">کل مبلغ سفارشات</div>
                      <div className="text-2xl font-black text-gray-800 mt-1">{orders.reduce((acc, o) => acc + o.totalPriceSnapshot, 0).toLocaleString('fa-IR')}</div>
                  </div>
              </div>

              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-right">
                      <thead className="bg-gray-50 text-gray-500 text-xs font-bold border-b">
                          <tr>
                              <th className="p-4">شماره سفارش</th>
                              <th className="p-4">فروشگاه</th>
                              <th className="p-4">تاریخ ثبت</th>
                              <th className="p-4">مبلغ کل (تومان)</th>
                              <th className="p-4">وضعیت</th>
                              <th className="p-4">عملیات</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {orders.length === 0 ? (
                              <tr><td colSpan={6} className="p-8 text-center text-gray-400">سفارشی یافت نشد.</td></tr>
                          ) : orders.map(order => {
                              const remainingTimeMs = getRemainingTimeMs(order.timestamp);
                              const isEditable = remainingTimeMs > 0;

                              return (
                              <React.Fragment key={order.id}>
                                  <tr className="hover:bg-gray-50">
                                      <td className="p-4 font-mono text-xs text-gray-400">{order.id}</td>
                                      <td className="p-4 font-bold text-gray-800">{order.storeName}</td>
                                      <td className="p-4 text-sm">{order.createdAt}</td>
                                      <td className="p-4 font-black text-primary">{order.totalPriceSnapshot.toLocaleString('fa-IR')}</td>
                                      <td className="p-4">{getStatusBadge(order.status)}</td>
                                      <td className="p-4">
                                          <div className="flex items-center gap-2">
                                              {/* Print Button */}
                                              <button onClick={() => handlePrintOrder(order)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="چاپ فاکتور"><Printer size={16}/></button>
                                              
                                              {/* Status Actions */}
                                              {order.status === 'NEW' && (
                                                  isEditable ? (
                                                     <div className="p-1.5 px-3 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-wait" title="منتظر اتمام زمان ویرایش مشتری">
                                                         <Timer size={14} className="animate-spin"/> {formatTime(remainingTimeMs)}
                                                     </div>
                                                  ) : (
                                                     <button onClick={() => onUpdateOrderStatus(order.id, 'CONFIRMED')} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="تایید سفارش"><Check size={16}/></button>
                                                  )
                                              )}
                                              {order.status === 'CONFIRMED' && (
                                                  <button onClick={() => onUpdateOrderStatus(order.id, 'IN_PRODUCTION')} className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100" title="شروع تولید"><Box size={16}/></button>
                                              )}
                                              {order.status === 'IN_PRODUCTION' && (
                                                  <button onClick={() => onUpdateOrderStatus(order.id, 'READY')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="اعلام آمادگی"><CheckCircle2 size={16}/></button>
                                              )}
                                              {order.status === 'READY' && (
                                                  <button onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="تحویل شد"><Truck size={16}/></button>
                                              )}
                                              {(order.status === 'NEW' || order.status === 'CONFIRMED') && (
                                                  <button onClick={() => onUpdateOrderStatus(order.id, 'CANCELED')} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="لغو"><X size={16}/></button>
                                              )}
                                              
                                              {/* Admin Edit Trigger */}
                                              <button onClick={() => startEditingOrder(order)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="ویرایش اطلاعات"><Pencil size={16}/></button>
                                          </div>
                                      </td>
                                  </tr>
                                  {/* Order Details Row */}
                                  <tr className="bg-gray-50/50">
                                      <td colSpan={6} className="p-4 pt-0">
                                          <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm">
                                              {/* Admin Editing Inline Form */}
                                              {editingOrderId === order.id ? (
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                      <div className="col-span-2 font-bold text-blue-800">ویرایش اطلاعات مشتری:</div>
                                                      <input value={editOrderData.customerName || ''} onChange={e=>setEditOrderData({...editOrderData, customerName: e.target.value})} className="p-2 rounded border" placeholder="نام مشتری"/>
                                                      <input value={editOrderData.customerPhone || ''} onChange={e=>setEditOrderData({...editOrderData, customerPhone: e.target.value})} className="p-2 rounded border" placeholder="تلفن"/>
                                                      <input value={editOrderData.deliveryAddress || ''} onChange={e=>setEditOrderData({...editOrderData, deliveryAddress: e.target.value})} className="p-2 rounded border" placeholder="آدرس"/>
                                                      <input 
                                                        value={editOrderData.deliveryDate || ''} 
                                                        onChange={e=> handleDateInput(e.target.value, (v) => setEditOrderData({...editOrderData, deliveryDate: v}))} 
                                                        className="p-2 rounded border text-center" 
                                                        dir="ltr" 
                                                        placeholder="تاریخ تحویل"
                                                      />
                                                      <div className="col-span-2 flex justify-end gap-2">
                                                          <button onClick={saveEditingOrder} className="bg-blue-600 text-white px-4 py-1 rounded">ذخیره</button>
                                                          <button onClick={() => setEditingOrderId(null)} className="bg-gray-300 px-4 py-1 rounded">لغو</button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2 border-b border-gray-100 pb-2">
                                                      <span><User size={12} className="inline mr-1"/>{order.customerName}</span>
                                                      <span><Phone size={12} className="inline mr-1"/>{order.customerPhone}</span>
                                                      <span><MapPin size={12} className="inline mr-1"/>{order.deliveryAddress || '---'}</span>
                                                      <span><Clock size={12} className="inline mr-1"/>تحویل: {order.deliveryDate || '---'}</span>
                                                  </div>
                                              )}
                                              
                                              <div className="font-bold mb-2 text-gray-500 text-xs">اقلام سفارش:</div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {order.lines.map((line, idx) => (
                                                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                                          <div className="flex flex-col">
                                                              <div className="flex items-center">
                                                                <span className="font-black text-gray-700">{line.categorySnapshot}</span>
                                                                <span className="mx-1 text-gray-400">/</span>
                                                                <span className="text-gray-600">{line.itemSnapshot}</span>
                                                                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] mr-2">x{line.quantity}</span>
                                                              </div>
                                                              {(line.color || line.description) && (
                                                                  <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                                                                    {line.color && <span className="bg-white px-1 rounded border">کد رنگ چوب: {line.color}</span>}
                                                                    {line.description && <span className="bg-white px-1 rounded border">توضیح: {line.description}</span>}
                                                                  </div>
                                                              )}
                                                          </div>
                                                          <div className="font-mono text-gray-500 text-xs">
                                                              {line.lineTotal.toLocaleString('fa-IR')}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      </td>
                                  </tr>
                              </React.Fragment>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- REPORTS TAB --- */}
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
                    
                    {/* Store Filter */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Store size={12}/> انتخاب فروشگاه‌ها</label>
                        <div className="relative group">
                            <button className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-800 text-right flex justify-between items-center">
                                {reportSelectedStoreIds.length === 0 ? 'همه فروشگاه‌ها' : `${reportSelectedStoreIds.length} فروشگاه انتخاب شده`}
                                <ChevronDown size={14}/>
                            </button>
                            <div className="absolute top-full right-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-2 mt-1 hidden group-hover:block z-50 max-h-48 overflow-y-auto">
                                <div onClick={() => setReportSelectedStoreIds([])} className={`p-2 rounded cursor-pointer text-xs font-bold hover:bg-gray-50 ${reportSelectedStoreIds.length === 0 ? 'text-primary' : ''}`}>همه فروشگاه‌ها</div>
                                {stores.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => {
                                            setReportSelectedStoreIds(prev => 
                                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                            );
                                        }}
                                        className="p-2 rounded cursor-pointer text-xs flex items-center gap-2 hover:bg-gray-50"
                                    >
                                        {reportSelectedStoreIds.includes(s.id) ? <CheckSquare size={14} className="text-primary"/> : <Square size={14} className="text-gray-300"/>}
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                                <th className="p-3">فروشگاه</th>
                                                <th className="p-3">مشتری</th>
                                                <th className="p-3">مبلغ (تومان)</th>
                                                <th className="p-3 rounded-l-xl">وضعیت</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filtered.map(o => (
                                                <tr key={o.id}>
                                                    <td className="p-3 font-mono text-xs">{o.createdAt}</td>
                                                    <td className="p-3 font-bold text-gray-700">{o.storeName}</td>
                                                    <td className="p-3 text-gray-600">{o.customerName}</td>
                                                    <td className="p-3 font-black">{o.totalPriceSnapshot.toLocaleString('fa-IR')}</td>
                                                    <td className="p-3">{getStatusBadge(o.status)}</td>
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
                                    <div className="font-black text-xl text-primary">درآمد کل بازه: {totalAmount.toLocaleString('fa-IR')} تومان</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
                                            <tr>
                                                <th className="p-3 rounded-r-xl">#</th>
                                                <th className="p-3">نام کالا</th>
                                                <th className="p-3">تعداد فروش</th>
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

      {/* ... (Existing Models and Stores tabs code remains unchanged) ... */}
      
      {/* --- MODELS TAB --- */}
      {activeTab === 'models' && (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-black mb-4 flex gap-2"><FilePlus className="text-primary"/> تعریف مدل جدید (سرشاخه)</h3>
                  <form onSubmit={handleCreateModel} className="flex gap-4">
                      <input 
                          type="text" 
                          value={newModelName} 
                          onChange={e => setNewModelName(e.target.value)} 
                          placeholder="نام مدل (مثلاً: مدل ماتینا)..." 
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-primary text-gray-800"
                      />
                      <button type="submit" className="bg-primary text-white px-8 rounded-xl font-black hover:bg-yellow-700 transition-colors">افزودن</button>
                  </form>
              </div>

              <div className="space-y-4">
                  {categories.map(cat => {
                      const catItems = items.filter(i => i.categoryId === cat.id);
                      const isAllSelected = catItems.length > 0 && catItems.every(i => selectedItemIds.includes(i.id));
                      const isEditing = editingCategoryId === cat.id;

                      return (
                          <div key={cat.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                              <div onClick={() => !isEditing && toggleModel(cat.id)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors group">
                                  <div className="flex items-center gap-3 flex-1">
                                      <div className={`w-3 h-3 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                      
                                      {isEditing ? (
                                          <div className="flex items-center gap-2 flex-1 max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
                                              <input 
                                                  type="text" 
                                                  value={editingCategoryName} 
                                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                                  className="flex-1 bg-white border-2 border-primary rounded-lg px-2 py-1 text-lg font-black text-gray-800 outline-none"
                                                  autoFocus
                                              />
                                              <button onClick={saveEditingCategory} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={18} /></button>
                                              <button onClick={cancelEditingCategory} className="p-1.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500"><X size={18} /></button>
                                          </div>
                                      ) : (
                                          <h4 className={`font-black text-lg ${cat.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{cat.name}</h4>
                                      )}

                                      {!isEditing && <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800 font-bold">{catItems.length} زیرمجموعه</span>}
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                      {!isEditing && (
                                        <>
                                            <button onClick={(e) => startEditingCategory(e, cat)} className="p-2 text-gray-400 hover:text-primary hover:bg-yellow-50 rounded-full transition-all" title="ویرایش نام مدل">
                                                <Pencil size={18}/>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onToggleCategory(cat.id); }} className="p-2 text-gray-400 hover:text-primary" title="تغییر وضعیت نمایش">
                                                {cat.isActive ? <Eye size={20}/> : <EyeOff size={20}/>}
                                            </button>
                                            <button 
                                                onClick={(e) => requestDeleteCategory(e, cat.id, cat.name)} 
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all relative z-10"
                                                title="حذف مدل"
                                                type="button"
                                            >
                                                <Trash2 size={20}/>
                                            </button>
                                        </>
                                      )}
                                      {expandedModels[cat.id] ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                                  </div>
                              </div>

                              {expandedModels[cat.id] && (
                                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                      {/* Batch Add Items */}
                                      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
                                          <div className="text-xs font-bold text-gray-500 mb-2">افزودن زیرمجموعه جدید (هر سطر یک کالا):</div>
                                          <div className="flex gap-2">
                                              <textarea 
                                                  value={batchInput[cat.id] || ''} 
                                                  onChange={e => setBatchInput(prev => ({...prev, [cat.id]: e.target.value}))}
                                                  placeholder="مثلاً:&#10;مبل تک نفره&#10;سه نفره"
                                                  className="flex-1 h-20 bg-gray-50 border border-gray-300 rounded-xl p-2 text-sm font-bold text-gray-800"
                                              />
                                              <button onClick={() => handleBatchAddItems(cat.id)} className="bg-primary text-white px-4 rounded-xl font-bold text-sm">ثبت</button>
                                          </div>
                                      </div>

                                      {/* Items Table */}
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-right text-sm">
                                              <thead className="text-gray-400 text-xs border-b border-gray-200">
                                                  <tr>
                                                      <th className="p-2 w-10 text-center">
                                                          <button onClick={() => toggleCategorySelection(catItems)} className="text-gray-400 hover:text-primary transition-colors">
                                                              {isAllSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                          </button>
                                                      </th>
                                                      <th className="p-2">نام کالا</th>
                                                      <th className="p-2">قیمت پایه (تومان)</th>
                                                      <th className="p-2 w-20 text-center">وضعیت</th>
                                                      <th className="p-2 w-20">حذف</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-200">
                                                  {catItems.map(item => {
                                                      const isSelected = selectedItemIds.includes(item.id);
                                                      return (
                                                          <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-yellow-50' : 'bg-white'}`}>
                                                              <td className="p-2 text-center">
                                                                  <button onClick={() => toggleItemSelection(item.id)} className={`transition-colors ${isSelected ? 'text-primary' : 'text-gray-300 hover:text-gray-400'}`}>
                                                                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                                  </button>
                                                              </td>
                                                              <td className="p-2">
                                                                  <input 
                                                                      type="text" value={item.name}
                                                                      onChange={e => onUpdateItem({...item, name: e.target.value})}
                                                                      className="w-full bg-transparent border-none outline-none font-bold text-gray-700 focus:ring-0"
                                                                  />
                                                              </td>
                                                              <td className="p-2">
                                                                  <input 
                                                                      type="text" 
                                                                      value={item.basePrice === 0 ? '' : item.basePrice.toLocaleString()}
                                                                      onChange={(e) => handlePriceChange(e, item)}
                                                                      onKeyDown={handlePriceKeyDown}
                                                                      placeholder="مبلغ..."
                                                                      className="price-input-field w-full bg-white border-2 border-gray-300 hover:border-primary focus:border-primary rounded-lg px-3 py-2 text-gray-800 font-black text-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                                  />
                                                              </td>
                                                              <td className="p-2 text-center">
                                                                  <button onClick={() => onUpdateItem({...item, isActive: !item.isActive})} className={`p-1 rounded ${item.isActive ? 'text-emerald-500' : 'text-gray-300'}`}>
                                                                      {item.isActive ? <CheckCircle2 size={18}/> : <X size={18}/>}
                                                                  </button>
                                                              </td>
                                                              <td className="p-2 text-center relative">
                                                                  <button 
                                                                      type="button"
                                                                      onClick={(e) => requestDeleteItem(e, item.id, item.name)}
                                                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all relative z-10"
                                                                      title="حذف کالا"
                                                                  >
                                                                      <Trash2 size={18}/>
                                                                  </button>
                                                              </td>
                                                          </tr>
                                                      );
                                                  })}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- STORES TAB --- */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-800">
                        <Plus className="text-primary" />
                        {editingStoreId ? 'ویرایش گالری' : 'ثبت گالری جدید'}
                    </h3>
                    <form onSubmit={handleStoreSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 mr-2">نام نمایشگاه</label>
                            <input type="text" placeholder="مثلا: مبل لوکس پایتخت" required value={newStoreName} onChange={e=>setNewStoreName(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary !text-black placeholder-gray-500 font-bold"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 mr-2">نام کاربری</label>
                            <input type="text" placeholder="username" required value={newStoreUser} onChange={e=>setNewStoreUser(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono !text-black placeholder-gray-500"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 mr-2">رمز عبور</label>
                            <input type="text" placeholder="********" required value={newStorePass} onChange={e=>setNewStorePass(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary !text-black placeholder-gray-500"/>
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-3 rounded-2xl font-black text-lg hover:shadow-lg transition-all">تایید و ثبت نمایشگاه</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                {stores.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-yellow-50 text-primary rounded-2xl"><Store size={32}/></div>
                            <div>
                                <div className="font-black text-gray-800 text-lg">{s.name}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-400">نام کاربری:</span>
                                        <span className="font-mono font-black text-gray-600 tracking-wider">{s.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-400">رمز عبور:</span>
                                        <span className="font-mono font-black text-gray-600 tracking-wider blur-sm hover:blur-none transition-all cursor-pointer">{s.password}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => { setEditingStoreId(s.id); setNewStoreName(s.name); setNewStoreUser(s.username); setNewStorePass(s.password); }} className="p-2 text-gray-400 hover:text-primary"><Pencil size={20}/></button>
                             <button onClick={()=>requestDeleteStore(s.id, s.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={20}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- BULK ACTION BAR --- */}
      {selectedItemIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white p-2 rounded-2xl shadow-2xl flex items-center gap-4 z-40 animate-slideUp border border-gray-700">
              <div className="px-4 font-bold border-l border-gray-600">
                  {selectedItemIds.length} <span className="text-xs font-normal text-gray-400">مورد انتخاب شده</span>
              </div>
              <div className="flex items-center gap-1">
                  <button onClick={() => handleBulkVisibility(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-xl transition-colors text-emerald-400 text-sm font-bold">
                      <Eye size={18}/> نمایش
                  </button>
                  <button onClick={() => handleBulkVisibility(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-xl transition-colors text-gray-400 text-sm font-bold">
                      <EyeOff size={18}/> عدم نمایش
                  </button>
                  <div className="w-px h-6 bg-gray-600 mx-2"></div>
                  <button onClick={requestBulkDelete} className="flex items-center gap-2 px-3 py-2 hover:bg-red-900/30 rounded-xl transition-colors text-red-400 text-sm font-bold">
                      <Trash2 size={18}/> حذف
                  </button>
              </div>
              <button onClick={() => setSelectedItemIds([])} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-xl transition-colors">
                  <X size={16} />
              </button>
          </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform scale-100 transition-all">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-black text-gray-800 mb-2">
                 {deleteConfirm.type === 'bulk_items' ? 'حذف گروهی' : 'تایید حذف'}
             </h3>
             <p className="text-gray-500 text-sm mb-6">
               آیا از حذف <span className="font-bold text-gray-800">"{deleteConfirm.name}"</span> اطمینان دارید؟
               {deleteConfirm.type === 'category' && <br/><span className="text-red-500 text-xs mt-1 block">هشدار: تمام کالاهای زیرمجموعه نیز حذف خواهند شد.</span>}
               {deleteConfirm.type === 'store' && <br/><span className="text-red-500 text-xs mt-1 block">هشدار: حساب کاربری فروشگاه کاملا پاک خواهد شد.</span>}
               {deleteConfirm.type === 'bulk_items' && <br/><span className="text-red-500 text-xs mt-1 block">این عملیات غیرقابل بازگشت است.</span>}
             </p>
             <div className="flex gap-3">
               <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">انصراف</button>
               <button onClick={confirmDeleteAction} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">بله، حذف شود</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPanel;