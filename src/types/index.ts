export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface StoreDesign {
  primaryColor: string; // Hex color e.g. '#059669'
  secondaryColor: string; // Hex color e.g. '#0f172a'
  logoType: 'text' | 'image';
  logoText: string;
  logoImageUrl?: string;
  announcementText?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  niche: string;
  currency: string;
  isDefault?: boolean;
  design: StoreDesign;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSectionConfig {
  enabled: boolean;
  badgeText?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  heroImageUrl?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description?: string;
}

export interface FeaturesSectionConfig {
  enabled: boolean;
  title?: string;
  items: FeatureItem[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  avatarUrl?: string;
}

export interface TestimonialsSectionConfig {
  enabled: boolean;
  title?: string;
  items: TestimonialItem[];
}

export interface GuaranteeSectionConfig {
  enabled: boolean;
  title?: string;
  description?: string;
  badgeText?: string;
}

export interface LandingPageDesignConfig {
  hero: HeroSectionConfig;
  features: FeaturesSectionConfig;
  testimonials: TestimonialsSectionConfig;
  guarantee: GuaranteeSectionConfig;
}

export interface Product {
  id: string;
  storeId?: string; // Belongs to Store
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
  designConfig?: LandingPageDesignConfig;
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
