import { Product, Order, OrderStatus, DashboardStats } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/seedData';

const PRODUCTS_KEY = 'allio_products';
const ORDERS_KEY = 'allio_orders';

export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const getProductBySlug = (slug: string): Product | undefined => {
  const products = getProducts();
  return products.find(p => p.slug === slug || p.id === slug);
};

export const saveProduct = (productData: Partial<Product> & { name: string; price: number }): Product => {
  const products = getProducts();
  const slug = productData.slug || productData.name.toLowerCase().trim()
    .replace(/[^\w\u0621-\u064A\s-]/g, '')
    .replace(/\s+/g, '-');

  if (productData.id) {
    // Update existing
    const index = products.findIndex(p => p.id === productData.id);
    if (index !== -1) {
      const updated: Product = {
        ...products[index],
        ...productData,
        slug: slug || products[index].slug,
        updatedAt: new Date().toISOString()
      };
      products[index] = updated;
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      return updated;
    }
  }

  // Create new
  const newProduct: Product = {
    id: 'prod-' + Date.now(),
    slug: slug || 'product-' + Date.now(),
    name: productData.name,
    price: Number(productData.price),
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
    currency: 'DH',
    shortDescription: productData.shortDescription || '',
    fullDescription: productData.fullDescription || '',
    features: productData.features || [],
    images: productData.images && productData.images.length > 0 ? productData.images : [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
    ],
    badge: productData.badge || 'توصيل مجاني 🚚',
    freeShipping: productData.freeShipping !== false,
    inStock: true,
    stockCount: productData.stockCount || 15,
    fbPixelId: productData.fbPixelId?.trim() || '',
    tiktokPixelId: productData.tiktokPixelId?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    salesCount: 0
  };

  products.unshift(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
};

export const deleteProduct = (id: string): boolean => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
  return true;
};

export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_ORDERS;
  }
};

export const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
  const orders = getOrders();
  const newOrderNumber = 'AL-' + (1050 + orders.length);
  const newOrder: Order = {
    ...orderData,
    id: 'ord-' + Date.now(),
    orderNumber: newOrderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Update product salesCount and views
  const products = getProducts();
  const prodIndex = products.findIndex(p => p.id === orderData.productId);
  if (prodIndex !== -1) {
    products[prodIndex].salesCount = (products[prodIndex].salesCount || 0) + (orderData.quantity || 1);
    if (products[prodIndex].stockCount > 0) {
      products[prodIndex].stockCount = Math.max(0, products[prodIndex].stockCount - (orderData.quantity || 1));
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  return newOrder;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): boolean => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return true;
  }
  return false;
};

export const deleteOrder = (orderId: string): boolean => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  return true;
};

export const getDashboardStats = (): DashboardStats => {
  const orders = getOrders();
  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.status === 'new').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  
  // Calculate revenue from non-cancelled orders
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  
  // Approximate conversion rate
  const products = getProducts();
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0) || 1;
  const conversionRate = Number(((totalOrders / Math.max(totalViews, 100)) * 100).toFixed(1));

  return {
    totalOrders,
    newOrders,
    confirmedOrders,
    shippedOrders,
    totalRevenue,
    conversionRate,
    averageOrderValue
  };
};

/**
 * Clean & Format Moroccan Phone Number for WhatsApp
 * E.g., 0661849201 -> 212661849201
 */
export const formatMoroccanPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '212' + digits.substring(1);
  }
  if (digits.startsWith('212')) {
    return digits;
  }
  return '212' + digits;
};

/**
 * Generate Direct WhatsApp Confirmation Link for COD customer
 */
export const generateWhatsAppConfirmLink = (order: Order): string => {
  const waNumber = formatMoroccanPhoneForWhatsApp(order.phoneNumber);
  const message = `السلام عليكم ورحمة الله، أخي/أختي ${order.customerName} 👋
معاك فريق متجر allio بخصوص طلبكم رقم (${order.orderNumber}):
📦 المنتج: ${order.productName}
💰 المبلغ الإجمالي: ${order.totalPrice} درهم مغربي (الدفع عند الاستلام)
🚚 العنوان المسجل: ${order.address} - ${order.city}

واش نأكدو ليك الإرسالية باش نجهزوها مع الموزع للتوصيل السريع؟`;

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Export Orders to Excel / CSV with UTF-8 BOM so Arabic text is preserved perfectly
 */
export const exportOrdersToExcelCSV = (orders: Order[]) => {
  const headers = [
    'رقم الطلب',
    'اسم الزبون',
    'رقم الهاتف',
    'المدينة',
    'العنوان السكني',
    'المنتج',
    'الكمية',
    'سعر الوحدة (درهم)',
    'مصاريف الشحن',
    'المجموع (درهم)',
    'حالة الطلب',
    'تاريخ الطلب',
    'ملاحظات'
  ];

  const statusLabels: Record<OrderStatus, string> = {
    new: 'جديد',
    confirmed: 'تم التأكيد',
    shipped: 'شحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  };

  const rows = orders.map(o => [
    `"${o.orderNumber}"`,
    `"${o.customerName.replace(/"/g, '""')}"`,
    `"${o.phoneNumber}"`,
    `"${o.city.replace(/"/g, '""')}"`,
    `"${o.address.replace(/"/g, '""')}"`,
    `"${o.productName.replace(/"/g, '""')}"`,
    o.quantity,
    o.unitPrice,
    o.shippingFee,
    o.totalPrice,
    `"${statusLabels[o.status] || o.status}"`,
    `"${new Date(o.createdAt).toLocaleString('fr-FR')}"`,
    `"${(o.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `allio_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
