import React, { useState, useId } from 'react';
import { Product, Order } from '../../types';
import { MOROCCAN_CITIES } from '../../data/moroccanCities';
import { createOrder } from '../../lib/storage';
import { trackPixelEvent } from '../../lib/pixelTracker';
import { Check, ShieldCheck, Truck, Sparkles, AlertCircle, ShoppingBag, PhoneCall } from 'lucide-react';

interface MoroccanOrderFormProps {
  product: Product;
  onOrderSuccess: (order: Order) => void;
}

export const MoroccanOrderForm: React.FC<MoroccanOrderFormProps> = ({
  product,
  onOrderSuccess
}) => {
  const formId = useId();
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('الدار البيضاء');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  // Validate Moroccan Phone Number (10 digits starting with 06, 07, or 05)
  const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
  const isPhoneValid = /^(06|07|05)\d{8}$/.test(cleanPhone);

  // Offers & Pricing bundles
  const getBundlePrice = (qty: number) => {
    if (qty === 1) return product.price;
    if (qty === 2) return Math.round(product.price * 2 * 0.85); // 15% discount for 2
    if (qty >= 3) return Math.round(product.price * 3 * 0.75); // 25% discount for 3
    return product.price * qty;
  };

  const totalPrice = getBundlePrice(quantity);
  const originalTotalPrice = (product.originalPrice || Math.round(product.price * 1.5)) * quantity;
  const savings = originalTotalPrice - totalPrice;

  const handleFieldFocus = () => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      trackPixelEvent('InitiateCheckout', product.fbPixelId, product.tiktokPixelId, {
        content_name: product.name,
        content_ids: [product.id],
        value: totalPrice,
        currency: 'MAD'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (!customerName.trim()) {
      return;
    }

    if (!isPhoneValid) {
      return;
    }

    if (!city) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = createOrder({
        productId: product.id,
        productName: product.name,
        customerName: customerName.trim(),
        phoneNumber: cleanPhone,
        city: city,
        address: address.trim() || 'العنوان عبر الهاتف مع الموزع',
        quantity: quantity,
        unitPrice: product.price,
        shippingFee: 0,
        totalPrice: totalPrice,
        status: 'new',
        notes: notes.trim(),
        fbPixelFired: !!product.fbPixelId,
        tiktokPixelFired: !!product.tiktokPixelId
      });

      // Track Purchase on Pixels
      trackPixelEvent('Purchase', product.fbPixelId, product.tiktokPixelId, {
        content_name: product.name,
        content_ids: [product.id],
        value: totalPrice,
        currency: 'MAD',
        num_items: quantity,
        order_id: newOrder.orderNumber
      });

      onOrderSuccess(newOrder);
    } catch (err) {
      console.error('Order creation error', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="order-form-section" className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden scroll-mt-6">
      {/* Form Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>عرض حصري بالمغرب لفترة محدودة</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black tracking-tight">
            استمارة الطلب السريع والدفع عند الاستلام
          </h3>
          <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-md mx-auto">
            أدخل معلوماتك أدناه وسنتصل بك هاتفياً لتأكيد إرسال الطلبية إلى باب منزلك مجاناً
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 text-slate-800">
        {/* Quantity / Bundle Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            1. اختر العرض المناسب لك:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1 Piece */}
            <button
              type="button"
              onClick={() => setQuantity(1)}
              className={`p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                quantity === 1
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">قطعة واحدة (1)</span>
                {quantity === 1 && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs"><Check className="w-3.5 h-3.5" /></span>}
              </div>
              <div className="text-lg font-black text-emerald-700">
                {product.price} <span className="text-xs font-normal">درهم</span>
              </div>
              <span className="text-[11px] text-slate-500">سعر تجربة ممتاز</span>
            </button>

            {/* 2 Pieces - Best Deal */}
            <button
              type="button"
              onClick={() => setQuantity(2)}
              className={`p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden ${
                quantity === 2
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
                الأكثر طلباً ⭐
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">قطعتان (2)</span>
                {quantity === 2 && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs"><Check className="w-3.5 h-3.5" /></span>}
              </div>
              <div className="text-lg font-black text-emerald-700">
                {getBundlePrice(2)} <span className="text-xs font-normal">درهم</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">وفر 15% + توصيل مجاني</span>
            </button>

            {/* 3 Pieces - Family Pack */}
            <button
              type="button"
              onClick={() => setQuantity(3)}
              className={`p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                quantity === 3
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">3 قطع (عرض العائلة)</span>
                {quantity === 3 && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs"><Check className="w-3.5 h-3.5" /></span>}
              </div>
              <div className="text-lg font-black text-emerald-700">
                {getBundlePrice(3)} <span className="text-xs font-normal">درهم</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">وفر 25% من الثمن الأصلي</span>
            </button>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="space-y-4 pt-2">
          {/* Full Name */}
          <div>
            <label htmlFor={`${formId}-name`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onFocus={handleFieldFocus}
              placeholder="مثال: محمد العلوي"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm md:text-base"
            />
          </div>

          {/* Moroccan Phone Number with Instant Validation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={`${formId}-phone`} className="block text-sm font-semibold text-slate-800">
                رقم الهاتف (الواتساب) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-emerald-600" />
                سنتصل بك لتأكيد الطلب
              </span>
            </div>
            
            <div className="relative">
              <input
                id={`${formId}-phone`}
                type="tel"
                required
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneTouched(true);
                }}
                onFocus={handleFieldFocus}
                placeholder="0612345678"
                maxLength={14}
                className={`w-full px-4 py-3 rounded-xl border text-left font-mono tracking-wider outline-none transition-all text-base ${
                  phoneTouched && cleanPhone.length > 0
                    ? isPhoneValid
                      ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">🇲🇦 +212</span>
                {phoneTouched && isPhoneValid && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Real-time Phone Feedback */}
            {phoneTouched && !isPhoneValid && cleanPhone.length > 0 && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>رقم غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 06 أو 07 أو 05 (مثال: 0612345678)</span>
              </p>
            )}
            {phoneTouched && isPhoneValid && (
              <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>رقم هاتف مغربي صحيح ✓</span>
              </p>
            )}
          </div>

          {/* Moroccan City Dropdown Select */}
          <div>
            <label htmlFor={`${formId}-city`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              المدينة <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id={`${formId}-city`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={handleFieldFocus}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all appearance-none bg-white text-sm md:text-base cursor-pointer"
              >
                {MOROCCAN_CITIES.map((c) => (
                  <option key={c.id} value={c.nameAr}>
                    {c.nameAr} ({c.nameFr}) — {c.shippingDelay}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-600" />
              <span>التوصيل مجاني 100% إلى جميع المدن المغربية المسجلة</span>
            </p>
          </div>

          {/* Address */}
          <div>
            <label htmlFor={`${formId}-address`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              العنوان السكني أو الحي <span className="text-slate-400 text-xs">(لتسهيل وصول الموزع)</span>
            </label>
            <input
              id={`${formId}-address`}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={handleFieldFocus}
              placeholder="مثال: حي السلام، قرب مسجد بدر، رقم المنزل 12"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none transition-all placeholder:text-slate-400 text-sm md:text-base"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor={`${formId}-notes`} className="block text-xs font-medium text-slate-600 mb-1">
              ملاحظة للموزع (اختياري):
            </label>
            <input
              id={`${formId}-notes`}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: الاتصال بعد الساعة 3 زوالاً"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Price Summary Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between items-center text-slate-600">
            <span>المنتج ({quantity} قطعة):</span>
            <span className="font-semibold text-slate-800">{totalPrice} درهم</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>التوصيل السريع (المغرب):</span>
            <span className="text-emerald-700 font-bold">مجاناً (0 درهم)</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between items-center text-amber-700 text-xs">
              <span>قيمة التوفير اليوم:</span>
              <span className="font-bold">-{savings} درهم</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-black text-slate-900">
            <span>المجموع الصافي للدفع:</span>
            <span className="text-2xl text-emerald-700 font-black">
              {totalPrice} <span className="text-sm font-semibold">درهم</span>
            </span>
          </div>
        </div>

        {/* Animated High-Converting CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-lg md:text-xl shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 flex flex-col items-center justify-center gap-1 group animate-cod-cta"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span>{isSubmitting ? 'جاري تأكيد طلبك...' : 'اضغط هنا للطلب الآن'}</span>
            </div>
            <span className="text-xs md:text-sm font-normal text-emerald-100 flex items-center gap-1.5">
              <span>الدفع عند الاستلام بعد معاينة المنتج 📦 والتوصيل بالمجان</span>
            </span>
          </button>
        </div>

        {/* Moroccan Trust & Guarantees Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">توصيل سريع</span>
            <span className="text-[10px] text-slate-500">24h إلى 48h</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">الدفع عند الاستلام</span>
            <span className="text-[10px] text-slate-500">تفقد سلعتك أولاً</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">ضمان الاستبدال</span>
            <span className="text-[10px] text-slate-500">14 يوماً مجاناً</span>
          </div>
        </div>
      </form>
    </div>
  );
};
