import { Product, Order, OrderStatus, DashboardStats } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

const PRODUCTS_KEY = 'allio_products';
const ORDERS_KEY = 'allio_orders';

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
};

// ============================================================================
// PRODUCTS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getProducts = (): Product[] => {
  try {
    const data = safeLocalStorage.getItem(PRODUCTS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
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

  if (productData.id && productData.id.trim()) {
    // Update existing product
    const existingId = productData.id.trim();
    const index = products.findIndex(p => p.id === existingId);
    const existing = index !== -1 ? products[index] : ({} as Product);
    targetProduct = {
      ...existing,
      ...productData,
      id: existingId,
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
    // Create new product with a guaranteed unique document ID
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
  safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: targetProduct }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: targetProduct } }));
  }

  // 2. Permanent Cloud Firestore Sync
  try {
    const productRef = doc(db, 'products', targetProduct.id);
    await setDoc(productRef, targetProduct);
    console.log(`[Firebase] Successfully saved product doc: products/${targetProduct.id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${targetProduct.id}`);
  }

  return targetProduct;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  if (!id || typeof id !== 'string') {
    console.error('[Firebase Delete] Invalid product ID provided to deleteProduct:', id);
    return false;
  }

  const targetDocId = id.trim();
  console.log(`[Firebase Delete] Initiating deleteDoc for product with ID: "${targetDocId}"`);

  // 1. Optimistic Local Cache Update
  const products = getProducts();
  const filtered = products.filter(p => p.id !== targetDocId && p.slug !== targetDocId);
  safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: filtered } }));
  }

  // 2. Permanent Cloud Firestore Deletion via deleteDoc
  let success = false;
  try {
    const productRef = doc(db, 'products', targetDocId);
    await deleteDoc(productRef);
    console.log(`[Firebase Delete] Successfully executed deleteDoc on products/${targetDocId}`);
    success = true;
  } catch (error) {
    console.error(`[Firebase Delete] Error executing deleteDoc on products/${targetDocId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `products/${targetDocId}`);
  }

  // 3. Fallback verification: Check if any document has field id == targetDocId or slug == targetDocId
  try {
    const qField = query(collection(db, 'products'), where('id', '==', targetDocId));
    const snapField = await getDocs(qField);
    for (const d of snapField.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete] Also deleting matching id field doc: products/${d.id}`);
        await deleteDoc(doc(db, 'products', d.id));
      }
    }

    const qSlug = query(collection(db, 'products'), where('slug', '==', targetDocId));
    const snapSlug = await getDocs(qSlug);
    for (const d of snapSlug.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete] Also deleting matching slug doc: products/${d.id}`);
        await deleteDoc(doc(db, 'products', d.id));
      }
    }
  } catch (secondaryErr) {
    console.warn('[Firebase Delete] Secondary cleanup check warning:', secondaryErr);
  }

  return success;
};

// ============================================================================
// ORDERS API - FIRESTORE + OPTIMISTIC LOCAL CACHE
// ============================================================================

export const getOrders = (): Order[] => {
  try {
    const data = safeLocalStorage.getItem(ORDERS_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & { id?: string; orderNumber?: string }): Promise<Order> => {
  const orders = getOrders();
  const newId = orderData.id?.trim() || ('ord-' + Date.now());
  const newOrderNumber = orderData.orderNumber?.trim() || ('AL-' + (1050 + orders.length));
  const newOrder: Order = {
    ...orderData,
    id: newId,
    orderNumber: newOrderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Optimistic Local Update
  orders.unshift(newOrder);
  safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  // Update product salesCount and stockCount
  const products = getProducts();
  const prodIndex = products.findIndex(p => p.id === orderData.productId);
  if (prodIndex !== -1) {
    products[prodIndex].salesCount = (products[prodIndex].salesCount || 0) + (orderData.quantity || 1);
    if (products[prodIndex].stockCount > 0) {
      products[prodIndex].stockCount = Math.max(0, products[prodIndex].stockCount - (orderData.quantity || 1));
    }
    safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
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

  // 2. Permanent Cloud Firestore Sync via setDoc directly to Firebase
  try {
    const orderRef = doc(db, 'orders', newOrder.id);
    await setDoc(orderRef, newOrder);
    console.log(`[Firebase] Successfully created order doc: orders/${newOrder.id}`);
  } catch (error) {
    console.error(`[Firebase] Error creating order doc: orders/${newOrder.id}:`, error);
    handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
  }

  return newOrder;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
  if (!orderId) return false;
  const targetDocId = orderId.trim();
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === targetDocId || o.orderNumber === targetDocId);
  const updatedAt = new Date().toISOString();

  if (index !== -1) {
    orders[index].status = status;
    orders[index].updatedAt = updatedAt;
    safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: orders[index] }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: orders[index] } }));
    }
  }

  // Permanent Cloud Firestore Update
  let success = false;
  try {
    const orderRef = doc(db, 'orders', targetDocId);
    await updateDoc(orderRef, { status, updatedAt });
    console.log(`[Firebase Update Order] Successfully updated status on orders/${targetDocId}`);
    success = true;
  } catch (error) {
    console.warn(`[Firebase Update Order] Direct updateDoc failed on ${targetDocId}, trying query fallback:`, error);
    try {
      const qField = query(collection(db, 'orders'), where('id', '==', targetDocId));
      const snapField = await getDocs(qField);
      for (const d of snapField.docs) {
        await updateDoc(doc(db, 'orders', d.id), { status, updatedAt });
        success = true;
      }
    } catch (secErr) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${targetDocId}`);
      return false;
    }
  }

  return success;
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  if (!orderId || typeof orderId !== 'string') {
    console.error('[Firebase Delete Order] Invalid order ID provided:', orderId);
    return false;
  }

  const targetDocId = orderId.trim();
  console.log(`[Firebase Delete Order] Initiating permanent deleteDoc for order ID: "${targetDocId}"`);

  // 1. Optimistic Local Cache Update
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== targetDocId && o.orderNumber !== targetDocId);
  safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: filtered }));
    window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: filtered } }));
  }

  // 2. Permanent Cloud Firestore Deletion via deleteDoc
  let success = false;
  try {
    const orderRef = doc(db, 'orders', targetDocId);
    await deleteDoc(orderRef);
    console.log(`[Firebase Delete Order] Successfully executed deleteDoc on orders/${targetDocId}`);
    success = true;
  } catch (error) {
    console.error(`[Firebase Delete Order] Error executing deleteDoc on orders/${targetDocId}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `orders/${targetDocId}`);
  }

  // 3. Fallback cleanup: Check if any document has field id == targetDocId or orderNumber == targetDocId
  try {
    const qField = query(collection(db, 'orders'), where('id', '==', targetDocId));
    const snapField = await getDocs(qField);
    for (const d of snapField.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete Order] Also deleting matching id field doc: orders/${d.id}`);
        await deleteDoc(doc(db, 'orders', d.id));
      }
    }

    const qNum = query(collection(db, 'orders'), where('orderNumber', '==', targetDocId));
    const snapNum = await getDocs(qNum);
    for (const d of snapNum.docs) {
      if (d.id !== targetDocId) {
        console.log(`[Firebase Delete Order] Also deleting matching orderNumber doc: orders/${d.id}`);
        await deleteDoc(doc(db, 'orders', d.id));
      }
    }
  } catch (cleanupErr) {
    console.warn('[Firebase Delete Order] Secondary cleanup warning:', cleanupErr);
  }

  return success;
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
    onSnapshot(productsCol, (snapshot) => {
      safeLocalStorage.setItem('allio_products_seeded', 'true');

      if (snapshot.empty) {
        // If Firestore is empty (e.g. user deleted all products), KEEP IT EMPTY. Never auto-reseed dummy products!
        safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: [] } }));
        return;
      }

      const remoteProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        // CRITICAL: Bind id directly to docSnap.id to ensure the true Firebase document ID is used
        remoteProducts.push({
          ...data,
          id: docSnap.id
        });
      });

      // Sort by creation date
      remoteProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeLocalStorage.setItem(PRODUCTS_KEY, JSON.stringify(remoteProducts));
      window.dispatchEvent(new CustomEvent('allio_products_updated', { detail: remoteProducts }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'products', data: remoteProducts } }));
    }, (error) => {
      if (error && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn('[Firestore Sync] Products listener operating in offline cache mode:', error.message);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    });
  } catch (err) {
    console.error('Error starting products realtime listener', err);
  }

  // 2. Sync Orders Real-Time Listener
  try {
    const ordersCol = collection(db, 'orders');
    onSnapshot(ordersCol, (snapshot) => {
      safeLocalStorage.setItem('allio_orders_seeded', 'true');

      if (snapshot.empty) {
        // If Firestore is empty (e.g. user deleted all orders), KEEP IT EMPTY. Never auto-reseed dummy orders!
        safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: [] } }));
        return;
      }

      const remoteOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        // CRITICAL: Bind id directly to docSnap.id to ensure true Firebase document ID is used
        remoteOrders.push({
          ...data,
          id: docSnap.id
        });
      });

      // Sort by creation date
      remoteOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      safeLocalStorage.setItem(ORDERS_KEY, JSON.stringify(remoteOrders));
      window.dispatchEvent(new CustomEvent('allio_orders_updated', { detail: remoteOrders }));
      window.dispatchEvent(new CustomEvent('allio_data_updated', { detail: { type: 'orders', data: remoteOrders } }));
    }, (error) => {
      if (error && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn('[Firestore Sync] Orders listener operating in offline cache mode:', error.message);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
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
  
  // Calculated purely from orders: percentage of orders that are confirmed, shipped, or delivered
  const successfulCount = confirmedOrders + shippedOrders;
  const conversionRate = totalOrders > 0 ? Math.round((successfulCount / totalOrders) * 100) : 0;

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
