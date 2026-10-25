import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { 
  updateOrderStatus, 
  deleteOrder, 
  exportOrdersToExcelCSV, 
  generateWhatsAppConfirmLink 
} from '../../lib/storage';
import { 
  Search, Download, MessageSquare, Trash2, 
  Clock, CheckCircle, Truck, XCircle, PackageCheck, AlertCircle, RefreshCw 
} from 'lucide-react';

interface OrdersManagerProps {
  orders: Order[];
  onOrdersChange: () => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onOrdersChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    await updateOrderStatus(orderId, newStatus);
    onOrdersChange();
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
      await deleteOrder(orderId);
      onOrdersChange();
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
  const orderCities = Array.from(new Set(orders.map(o => o.city)));

  return (
    <div className="space-y-4">
      {/* Top Controls & Search Bar */}
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
            title="تحديث قائمة الطلبات الآن"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Export to Excel / CSV */}
          <button
            onClick={() => exportOrdersToExcelCSV(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إلى ملف Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          جميع الطلبات ({orders.length})
        </button>

        <button
          onClick={() => setStatusFilter('new')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
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
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">لا توجد طلبات تطابق معايير البحث الحالية</p>
            <p className="text-xs text-slate-400">ستظهر الطلبات الواردة من صفحات الهبوط هنا تلقائياً</p>
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

                      {/* Actions: WhatsApp confirmation & Delete */}
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

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(order.id)}
                            title="حذف الطلب"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
    </div>
  );
};
