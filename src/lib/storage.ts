import { Product, Order, OrderStatus, DashboardStats } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/seedData';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';

const PRODUCTS_KEY = 'allio_products';
const ORDERS_KEY = 'allio_orders';

// ============================================================================
// PRODUCTS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const getProductBySlug = (slug: string): Product | undefined => {
  const products = getProducts();
  return products.find(p => p.slug === slug || p.id === slug);
};

export const saveProduct = async (productData: Partial<Product> & { name: string; price: number }): Promise<Product> => {
  const products = getProducts();
  const slug = productData.slug || productData.name.toLowerCase().trim()
    .replace(/[^\w\u0621-\u064A\s-]/g, '')
    .replace(/\s+/g, '-');

  let targetProduct: Product;

  if (productData.id) {
    // Update existing product
    const index = products.findIndex(p => p.id === productData.id);
    const existing = index !== -1 ? products[index] : ({} as Product);
    targetProduct = {
      ...existing,
      ...productData,
      id: productData.id,
      slug: slug || existing.slug || 'product-' + Date.now(),
      name: productData.name,
      price: Number(productData.price),
      updatedAt: new Date().toISOString()
    } as Product;

    if (index !== -1) {
      products[index] = targetProduct;
    } else {
      products.unshift(targetProduct);
    }
  } else {
    // Create new product
    const newId = 'prod-' + Date.now();
    targetProduct = {
      id: newId,
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
      badge: productData.badge || 'عرض حصري بالمغرب 🔥',
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
    products.unshift(targetProduct);
  }

  // 1. Optimistic Local Update
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: targetProduct }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: targetProduct } }));
  }

  // 2. Permanent Cloud Firestore Sync
  try {
    const productRef = doc(db, 'products', targetProduct.id);
    await setDoc(productRef, targetProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${targetProduct.id}`);
  }

  return targetProduct;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated'));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products' } }));
  }

  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
  }

  return true;
};

// ============================================================================
// ORDERS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) {
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const orders = getOrders();
  const newOrderNumber = 'AL-' + (1050 + orders.length);
  const newOrder: Order = {
    ...orderData,
    id: 'ord-' + Date.now(),
    orderNumber: newOrderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Optimistic Local Update
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
    try {
      const prodRef = doc(db, 'products', products[prodIndex].id);
      updateDoc(prodRef, {
        salesCount: products[prodIndex].salesCount,
        stockCount: products[prodIndex].stockCount
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // Notify active components immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: newOrder }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: newOrder } }));
  }

  // 2. Permanent Cloud Firestore Sync
  try {
    const orderRef = doc(db, 'orders', newOrder.id);
    await setDoc(orderRef, newOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
  }

  return newOrder;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    const updatedAt = new Date().toISOString();
    orders[index].status = status;
    orders[index].updatedAt = updatedAt;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: orders[index] }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: orders[index] } }));
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status, updatedAt });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }

    return true;
  }
  return false;
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_orders_updated'));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders' } }));
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    await deleteDoc(orderRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
  }

  return true;
};

// ============================================================================
// REAL-TIME FIRESTORE SYNCHRONIZATION LISTENER
// ============================================================================

let isInitialized = false;

export const initFirestoreRealtimeSync = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Sync Products Real-Time Listener
  try {
    const productsCol = collection(db, 'products');
    onSnapshot(productsCol, async (snapshot) => {
      if (snapshot.empty) {
        // First boot: Seed Firestore with default Moroccan products
        console.log('Seeding initial products to Firestore...');
        for (const prod of INITIAL_PRODUCTS) {
          try {
            await setDoc(doc(db, 'products', prod.id), prod);
          } catch (e) {
            console.warn('Seeding product error:', e);
          }
        }
      } else {
        const remoteProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          remoteProducts.push(docSnap.data() as Product);
        });
        // Sort by creation date
        remoteProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(remoteProducts));
        window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: remoteProducts }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: remoteProducts } }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
  } catch (err) {
    console.error('Error starting products realtime listener', err);
  }

  // 2. Sync Orders Real-Time Listener
  try {
    const ordersCol = collection(db, 'orders');
    onSnapshot(ordersCol, async (snapshot) => {
      if (snapshot.empty) {
        // First boot: Seed Firestore with initial orders
        console.log('Seeding initial orders to Firestore...');
        for (const ord of INITIAL_ORDERS) {
          try {
            await setDoc(doc(db, 'orders', ord.id), ord);
          } catch (e) {
            console.warn('Seeding order error:', e);
          }
        }
      } else {
        const remoteOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          remoteOrders.push(docSnap.data() as Order);
        });
        remoteOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(ORDERS_KEY, JSON.stringify(remoteOrders));
        window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: remoteOrders }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: remoteOrders } }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
  } catch (err) {
    console.error('Error starting orders realtime listener', err);
  }
};

export const getDashboardStats = (): DashboardStats => {
  const orders = getOrders();
  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.status === 'new').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length;
  
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  
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
