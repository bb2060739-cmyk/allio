-- ==============================================================================
-- ALLIO COD PLATFORM - SUPABASE (POSTGRESQL) PRODUCTION DATABASE SCHEMA
-- ==============================================================================

-- 1. Products Table (قائمة المنتجات وصفحات الهبوط)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    currency VARCHAR(10) DEFAULT 'DH',
    short_description TEXT,
    full_description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    badge VARCHAR(100),
    free_shipping BOOLEAN DEFAULT true,
    in_stock BOOLEAN DEFAULT true,
    stock_count INTEGER DEFAULT 15,
    fb_pixel_id VARCHAR(100),
    tiktok_pixel_id VARCHAR(100),
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for blazing-fast lookup on Moroccan 4G mobile networks
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 2. Orders Table (إدارة الطلبات الواردة بنظام الدفع عند الاستلام)
CREATE TYPE order_status_type AS ENUM ('new', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- Format: 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,
    status order_status_type DEFAULT 'new' NOT NULL,
    notes TEXT,
    fb_pixel_fired BOOLEAN DEFAULT false,
    tiktok_pixel_fired BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning dashboard filtering and phone search
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_city ON public.orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. Row Level Security (RLS) Setup
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products for landing pages
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (true);

-- Allow public insert access for incoming orders from landing page form
CREATE POLICY "Public customers can create orders" 
ON public.orders FOR INSERT WITH CHECK (true);

-- Authenticated store admins can manage all data
CREATE POLICY "Admins have full access to products" 
ON public.products FOR ALL TO authenticated USING (true);

CREATE POLICY "Admins have full access to orders" 
ON public.orders FOR ALL TO authenticated USING (true);
