export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number; // In Moroccan Dirhams (DH)
  originalPrice?: number;
  currency: 'DH' | 'MAD';
  shortDescription: string;
  fullDescription: string;
  features: string[];
  images: string[];
  badge?: string;
  freeShipping: boolean;
  inStock: boolean;
  stockCount: number;
  fbPixelId?: string;
  tiktokPixelId?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  salesCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  customerName: string;
  phoneNumber: string; // Validated 10 digits starting with 06, 07, 05
  city: string;
  address: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  totalPrice: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fbPixelFired?: boolean;
  tiktokPixelFired?: boolean;
}

export interface MoroccanCity {
  id: string;
  nameAr: string;
  nameFr: string;
  shippingDelay: string;
  standardFee: number;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  platform: 'facebook' | 'tiktok';
  pixelId: string;
  eventName: string;
  data: Record<string, unknown>;
}

export interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}
