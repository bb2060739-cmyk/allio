import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product } from '../../types';
import { 
  updateOrderStatus, 
  deleteOrder, 
  createOrder,
  exportOrdersToExcelCSV, 
  generateWhatsAppConfirmLink,
  getProducts 
} from '../../lib/storage';
import { getLocalizedText } from '../../utils/i18n';
import { 
  Search, Download, MessageSquare, Trash2, Plus, 
  Clock, CheckCircle, Truck, XCircle, PackageCheck, AlertCircle, RefreshCw,
  Database, Check, AlertTriangle, X, Loader2
} from 'lucide-react';

interface OrdersManagerProps {
  orders: Order[];
  products?: Product[];
  onOrdersChange: () => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  products = [],
  onOrdersChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal & Feedback States
  const [orderToDelete, setProductOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // New Order Form State
  const availableProducts = products.length > 0 ? products : getProducts();
  const [formProductId, setFormProductId] = useState<string>(availableProducts[0]?.id || '');
  const [formCustomProductName, setFormCustomProductName] = useState<string>('');
  const [formCustomerName, setFormCustomerName] = useState<string>('');
  const [formPhoneNumber, setFormPhoneNumber] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('الدار البيضاء');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number>(availableProducts[0]?.price || 299);
  const [formShippingFee, setFormShippingFee] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<OrderStatus>('new');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formValidationErrors, setFormValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleUpdate = () => {
      onOrdersChange();
    };

    window.addEventListener('allio_orders_updated', handleUpdate);
    window.addEventListener('allio_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('allio_orders_updated', handleUpdate);
      window.removeEventListener('allio_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [onOrdersChange]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onOrdersChange();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Status labels & color badge styles
  const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    new: {
      label: 'جديد',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
    },
    confirmed: {
      label: 'تم التأكيد',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
    },
    shipped: {
      label: 'شحن',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-800',
      icon: <Truck className="w-3.5 h-3.5 text-purple-600" />
    },
    delivered: {
      label: 'تم التسليم',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      icon: <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
    },
    cancelled: {
      label: 'ملغي',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-800',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const ok = await updateOrderStatus(orderId, newStatus);
      if (ok) {
        setSuccessToast(`تم تحديث حالة الطلب (${orderId}) إلى "${statusConfig[newStatus]?.label || newStatus}" وحفظه في Firebase.`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
      onOrdersChange();
    } catch (e) {
      setErrorToast(`فشل تحديث حالة الطلب في قاعدة البيانات: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Execute Permanent Delete via deleteDoc
  const handleExecuteDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    setErrorToast(null);

    const docId = orderToDelete.id;
    const orderNum = orderToDelete.orderNumber;
    console.log(`[Admin Orders] Initiating permanent Firebase deletion for docId: ${docId} (${orderNum})`);

    try {
      const success = await deleteOrder(docId);
      if (success) {
        setSuccessToast(`تم حذف الطلب "${orderNum}" (ID: ${docId}) نهائياً من قاعدة بيانات Firebase Firestore عبر deleteDoc.`);
        onOrdersChange();
        setProductOrderToDelete(null);
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setErrorToast(`فشل حذف الطلب (${orderNum}) من Firestore. يرجى المحاولة مجدداً.`);
      }
    } catch (err) {
      console.error('Failed to execute delete on Firestore orders:', err);
      setErrorToast(`حدث خطأ أثناء حذف الطلب من Firebase: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Cleanup for all old dummy orders (if any exist)
  const dummyOrders = orders.filter(o => 
    o.id === 'ord-1048' || 
    o.id === 'ord-1049' || 
    o.customerName === 'حمزة الادريسي' || 
    o.customerName === 'فاطمة الزهراء بنجلون' ||
    o.customerName === 'يوسف العلمي'
  );

  const handlePurgeDummyOrders = async () => {
    if (!window.confirm(`هل تريد حذف كافة الطلبات التجريبية (${dummyOrders.length}) نهائياً من Firebase Firestore؟`)) {
      return;
    }
    setIsRefreshing(true);
    for (const d of dummyOrders) {
      await deleteOrder(d.id);
    }
    setSuccessToast(`تم حذف جميع الطلبات التجريبية (${dummyOrders.length}) نهائياً من Firebase Firestore.`);
    onOrdersChange();
    setIsRefreshing(false);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Handle Product Selector Change in Add Order Modal
  const handleSelectProduct = (pId: string) => {
    setFormProductId(pId);
    if (pId !== 'custom') {
      const selected = availableProducts.find(p => p.id === pId);
      if (selected) {
        setFormUnitPrice(selected.price);
      }
    }
  };

  // Handle Create New Order
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formCustomerName.trim()) {
      errors.customerName = 'المرجو إدخال الاسم الكامل للزبون';
    }
    if (!formPhoneNumber.trim()) {
      errors.phoneNumber = 'المرجو إدخال رقم الهاتف';
    }
    if (!formCity.trim()) {
      errors.city = 'المرجو إدخال المدينة';
    }
    if (!formAddress.trim()) {
      errors.address = 'المرجو إدخال عنوان التسليم';
    }

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    setFormValidationErrors({});
    setIsSavingOrder(true);
    setErrorToast(null);

    try {
      let finalProductName = formCustomProductName.trim();
      let finalProductId = formProductId;

      if (formProductId !== 'custom') {
        const prod = availableProducts.find(p => p.id === formProductId);
        if (prod) {
          finalProductName = getLocalizedText(prod.name);
          finalProductId = prod.id;
        }
      }

      if (!finalProductName) {
        finalProductName = 'طلب يدوي مخصص';
        finalProductId = 'custom-prod-' + Date.now();
      }

      const totalPrice = (Number(formUnitPrice) * Number(formQuantity)) + Number(formShippingFee);

      const created = await createOrder({
        productId: finalProductId,
        productName: finalProductName,
        customerName: formCustomerName.trim(),
        phoneNumber: formPhoneNumber.trim(),
        city: formCity.trim(),
        address: formAddress.trim(),
        quantity: Number(formQuantity),
        unitPrice: Number(formUnitPrice),
        shippingFee: Number(formShippingFee),
        totalPrice,
        status: formStatus,
        notes: formNotes.trim(),
        fbPixelFired: true,
        tiktokPixelFired: true
      });

      setSuccessToast(`تمت إضافة الطلب (${created.orderNumber}) وحفظه مباشرة في Firebase Firestore بنجاح!`);
      setIsAddOrderOpen(false);
      // Reset form
      setFormCustomerName('');
      setFormPhoneNumber('');
      setFormAddress('');
      setFormNotes('');
      setFormQuantity(1);
      onOrdersChange();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to create order in Firestore:', err);
      setErrorToast(`فشل حفظ الطلب في Firebase: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phoneNumber.includes(searchQuery) ||
      order.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCity = selectedCityFilter === 'all' || order.city === selectedCityFilter;

    return matchesSearch && matchesStatus && matchesCity;
  });

  // Unique cities from orders for filtering
  const orderCities = Array.from(new Set(orders.map(o => o.city).filter(Boolean)));

  const MOROCCAN_CITIES = [
    'الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير', 
    'مكناس', 'وجدة', 'القنيطرة', 'تطوان', 'تمارة', 'سلا', 'المحمدية',
    'الجديدة', 'بني ملال', 'الناظور', 'آسفي', 'خريبكة', 'سطات', 'العيون'
  ];

  return (
    <div className="space-y-4">
      {/* Toast Feedback Messages */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorToast && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button 
            onClick={() => setErrorToast(null)}
            className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Firebase Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">سجل الطلبات الواردة (COD Orders)</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                مزامنة حية مع Firebase Firestore
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              جميع عمليات الإضافة، التحديث، والحذف تنفذ مباشرة وسحابياً في قاعدة بيانات Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Purge Dummy Orders if any exist */}
          {dummyOrders.length > 0 && (
            <button
              onClick={handlePurgeDummyOrders}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="حذف جميع الطلبات التجريبية الافتراضية نهائياً من Firebase"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ الطلبات التجريبية ({dummyOrders.length})</span>
            </button>
          )}

          {/* Add Order Button */}
          <button
            onClick={() => {
              setFormValidationErrors({});
              setIsAddOrderOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إضافة طلب جديد</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الطلب، اسم الزبون، رقم الهاتف، أو المدينة..."
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs md:text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        {/* Action Controls: Export Excel & City Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City filter */}
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">جميع المدن ({orderCities.length})</option>
            {orderCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Live Refresh Button */}
          <button
            onClick={handleManualRefresh}
            title="تحديث قائمة الطلبات الآن من السحابة"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Export to Excel / CSV */}
          <button
            onClick={() => exportOrdersToExcelCSV(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إلى Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          جميع الطلبات ({orders.length})
        </button>

        <button
          onClick={() => setStatusFilter('new')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'new'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>جديد</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded-full font-bold">
            {orders.filter(o => o.status === 'new').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'confirmed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>تم التأكيد</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded-full font-bold">
            {orders.filter(o => o.status === 'confirmed').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('shipped')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'shipped'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>شحن</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 rounded-full font-bold">
            {orders.filter(o => o.status === 'shipped').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('delivered')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>تم التسليم</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 rounded-full font-bold">
            {orders.filter(o => o.status === 'delivered').length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>ملغي</span>
          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 rounded-full font-bold">
            {orders.filter(o => o.status === 'cancelled').length}
          </span>
        </button>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl text-slate-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">لا توجد أي طلبات حالياً</p>
              <p className="text-xs text-slate-400 mt-0.5">
                قاعدة بيانات Firestore نظيفة تماماً ولا تحتوي على طلبات. يمكنك إضافة طلب يدوياً أو انتظار طلبات الزبائن.
              </p>
            </div>
            <button
              onClick={() => {
                setFormValidationErrors({});
                setIsAddOrderOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة طلب جديد الآن</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs md:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">الزبون والهاتف</th>
                  <th className="py-3 px-4">المدينة والعنوان</th>
                  <th className="py-3 px-4">المنتج والكمية</th>
                  <th className="py-3 px-4">المجموع</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">حالة الطلب</th>
                  <th className="py-3 px-4 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const conf = statusConfig[order.status] || statusConfig.new;
                  const waLink = generateWhatsAppConfirmLink(order);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 rounded-md">
                          {order.orderNumber}
                        </span>
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-xs font-mono text-emerald-700 tracking-wider flex items-center gap-1 mt-0.5" dir="ltr">
                          <span>{order.phoneNumber}</span>
                          <span className="text-[10px] text-slate-400">🇲🇦</span>
                        </div>
                      </td>

                      {/* City & Address */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-900 block">{order.city}</span>
                        <span className="text-xs text-slate-500 truncate block" title={order.address}>
                          {order.address}
                        </span>
                      </td>

                      {/* Product Name & Qty */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="font-medium text-slate-800 line-clamp-1" title={order.productName}>
                          {order.productName}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          الكمية: <strong className="text-slate-900">{order.quantity}</strong>
                        </span>
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        {order.totalPrice} <span className="text-xs font-normal">درهم</span>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-MA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold py-1.5 px-2.5 rounded-lg border outline-none cursor-pointer ${conf.bg} ${conf.text}`}
                        >
                          <option value="new">جديد ⏳</option>
                          <option value="confirmed">تم التأكيد ✓</option>
                          <option value="shipped">شحن 🚚</option>
                          <option value="delivered">تم التسليم 📦</option>
                          <option value="cancelled">ملغي ✕</option>
                        </select>
                      </td>

                      {/* Actions: WhatsApp confirmation & Permanent Delete */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Direct Confirmation */}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="تأكيد الطلب بالواتساب"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {/* Permanent Delete */}
                          <button
                            onClick={() => setProductOrderToDelete(order)}
                            title="حذف هذا الطلب نهائياً من قاعدة بيانات Firebase"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Permanent Firebase Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                onClick={() => setProductOrderToDelete(null)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                تأكيد الحذف الدائم من Firebase Firestore
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                هل أنت متأكد من حذف هذا الطلب نهائياً؟ سيتم تنفيذ أمر <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">deleteDoc</code> لإزالته نهائياً من مجموعة <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">orders</code> في السحابة، ولن يظهر مجدداً عند تحديث الصفحة أو من أي جهاز آخر.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="font-bold font-mono text-slate-900">{orderToDelete.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم الزبون:</span>
                <span className="font-semibold text-slate-900">{orderToDelete.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المبلغ الإجمالي:</span>
                <span className="font-bold text-emerald-700">{orderToDelete.totalPrice} درهم</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">معرف المستند (Doc ID):</span>
                <span className="font-mono text-slate-600">{orderToDelete.id}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProductOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جارٍ الحذف من Firestore...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>نعم، احذف نهائياً (deleteDoc)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Order Modal (Writing directly to Firebase) */}
      {isAddOrderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">إضافة طلب جديد يدوياً</h3>
                  <p className="text-[11px] text-slate-500">سيتم حفظ هذا الطلب مباشرة في قاعدة بيانات Firebase Firestore السحابية</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOrderOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 mt-4 text-xs">
              {/* Product Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">المنتج المطلوب</label>
                <select
                  value={formProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs"
                >
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {getLocalizedText(p.name)} ({p.price} درهم)
                    </option>
                  ))}
                  <option value="custom">+ منتج مخصص آخر...</option>
                </select>
              </div>

              {formProductId === 'custom' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المنتج المخصص</label>
                  <input
                    type="text"
                    value={formCustomProductName}
                    onChange={(e) => setFormCustomProductName(e.target.value)}
                    placeholder="أدخل اسم المنتج المخصص..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              )}

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم الكامل للزبون *</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="مثال: محمد التازي"
                    className={`w-full px-3 py-2 border rounded-xl outline-none ${
                      formValidationErrors.customerName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  {formValidationErrors.customerName && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formValidationErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف المغربي *</label>
                  <input
                    type="tel"
                    value={formPhoneNumber}
                    onChange={(e) => setFormPhoneNumber(e.target.value)}
                    placeholder="مثال: 0612345678"
                    dir="ltr"
                    className={`w-full px-3 py-2 border rounded-xl outline-none text-left ${
                      formValidationErrors.phoneNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  {formValidationErrors.phoneNumber && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formValidationErrors.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة *</label>
                  <input
                    type="text"
                    list="moroccan-cities-list"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="اختر أو اكتب المدينة..."
                    className={`w-full px-3 py-2 border rounded-xl outline-none ${
                      formValidationErrors.city ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  <datalist id="moroccan-cities-list">
                    {MOROCCAN_CITIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {formValidationErrors.city && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{formValidationErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة الطلب الأولية</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    <option value="new">جديد (قيد المراجعة)</option>
                    <option value="confirmed">تم التأكيد هاتفياً</option>
                    <option value="shipped">تم الشحن مع شركة التوصيل</option>
                    <option value="delivered">تم التسليم واستلام المبلغ</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان السكني *</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="مثال: شارع الحسن الثاني، عمارة 12، الشقة 4"
                  className={`w-full px-3 py-2 border rounded-xl outline-none ${
                    formValidationErrors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                {formValidationErrors.address && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{formValidationErrors.address}</p>
                )}
              </div>

              {/* Price & Quantity & Shipping */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">سعر الوحدة (DH)</label>
                  <input
                    type="number"
                    min="0"
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">الشحن (DH)</label>
                  <input
                    type="number"
                    min="0"
                    value={formShippingFee}
                    onChange={(e) => setFormShippingFee(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl text-emerald-900 border border-emerald-200 font-bold">
                <span>المبلغ الإجمالي المحسوب:</span>
                <span className="text-sm">{(formUnitPrice * formQuantity) + formShippingFee} درهم مغربي</span>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ملاحظات الزبون، موعد الاتصال، أو تفاصيل التوصيل..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOrderOpen(false)}
                  disabled={isSavingOrder}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ الحفظ في Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ الطلب مباشرة في Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
