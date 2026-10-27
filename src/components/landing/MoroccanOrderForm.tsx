import React, { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, Order } from '../../types';
import { MOROCCAN_CITIES } from '../../data/moroccanCities';
import { createOrder, getStoreById, getDefaultDesignConfig } from '../../lib/storage';
import { trackPixelEvent } from '../../lib/pixelTracker';
import { getLocalizedText } from '../../utils/i18n';
import { Check, ShieldCheck, Truck, Sparkles, AlertCircle, ShoppingBag, PhoneCall } from 'lucide-react';

interface MoroccanOrderFormProps {
  product: Product;
  onOrderSuccess: (order: Order) => void;
}

export const MoroccanOrderForm: React.FC<MoroccanOrderFormProps> = ({
  product,
  onOrderSuccess
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const isRTL = currentLang === 'ar';

  const formId = useId();
  const store = getStoreById(product.storeId);
  const design = product.designConfig || getDefaultDesignConfig(
    getLocalizedText(product.name, currentLang),
    getLocalizedText(product.fullDescription, currentLang)
  );
  const orderFormConfig = design.orderForm;
  const primaryColor = orderFormConfig?.submitButtonColor || store.design?.primaryColor || '#059669';
  const secondaryColor = store.design?.secondaryColor || '#0f172a';

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  // Field errors & touched state
  const [errors, setErrors] = useState<{
    customerName?: string;
    phoneNumber?: string;
    city?: string;
    address?: string;
  }>({});
  const [touched, setTouched] = useState<{
    customerName: boolean;
    phoneNumber: boolean;
    city: boolean;
    address: boolean;
  }>({
    customerName: false,
    phoneNumber: false,
    city: false,
    address: false,
  });

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
        content_name: getLocalizedText(product.name, currentLang),
        content_ids: [product.id],
        value: totalPrice,
        currency: 'MAD'
      });
    }
  };

  // Validation function for all strictly required fields
  const validateFields = (values: {
    customerName: string;
    phoneNumber: string;
    city: string;
    address: string;
  }) => {
    const errs: {
      customerName?: string;
      phoneNumber?: string;
      city?: string;
      address?: string;
    } = {};

    // 1. Full Name
    if (!values.customerName.trim()) {
      errs.customerName = t('order_form.validation_name_required');
    } else if (values.customerName.trim().length < 3) {
      errs.customerName = t('order_form.validation_name_short');
    }

    // 2. Phone Number
    const cleaned = values.phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
    if (!values.phoneNumber.trim()) {
      errs.phoneNumber = t('order_form.validation_phone_required');
    } else if (!/^(06|07|05)\d{8}$/.test(cleaned)) {
      errs.phoneNumber = t('order_form.validation_phone_invalid');
    }

    // 3. City
    if (!values.city || !values.city.trim()) {
      errs.city = t('order_form.validation_city_required');
    }

    // 4. Address
    if (!values.address.trim()) {
      errs.address = t('order_form.validation_address_required');
    } else if (values.address.trim().length < 4) {
      errs.address = t('order_form.validation_address_short');
    }

    return errs;
  };

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    if (touched.customerName) {
      if (!val.trim()) {
        setErrors(prev => ({ ...prev, customerName: t('order_form.validation_name_required') }));
      } else if (val.trim().length < 3) {
        setErrors(prev => ({ ...prev, customerName: t('order_form.validation_name_short') }));
      } else {
        setErrors(prev => ({ ...prev, customerName: undefined }));
      }
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (touched.phoneNumber) {
      const cleaned = val.replace(/\s+/g, '').replace(/-/g, '');
      if (!val.trim()) {
        setErrors(prev => ({ ...prev, phoneNumber: t('order_form.validation_phone_required') }));
      } else if (!/^(06|07|05)\d{8}$/.test(cleaned)) {
        setErrors(prev => ({ ...prev, phoneNumber: t('order_form.validation_phone_invalid') }));
      } else {
        setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
    }
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    if (touched.city) {
      if (!val.trim()) {
        setErrors(prev => ({ ...prev, city: t('order_form.validation_city_required') }));
      } else {
        setErrors(prev => ({ ...prev, city: undefined }));
      }
    }
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (touched.address) {
      if (!val.trim()) {
        setErrors(prev => ({ ...prev, address: t('order_form.validation_address_required') }));
      } else if (val.trim().length < 4) {
        setErrors(prev => ({ ...prev, address: t('order_form.validation_address_short') }));
      } else {
        setErrors(prev => ({ ...prev, address: undefined }));
      }
    }
  };

  const handleBlur = (field: 'customerName' | 'phoneNumber' | 'city' | 'address') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const currentValidation = validateFields({ customerName, phoneNumber, city, address });
    setErrors(prev => ({ ...prev, [field]: currentValidation[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      customerName: true,
      phoneNumber: true,
      city: true,
      address: true
    });

    const validationErrors = validateFields({
      customerName,
      phoneNumber,
      city,
      address
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.customerName) {
        document.getElementById(`${formId}-name`)?.focus();
      } else if (validationErrors.phoneNumber) {
        document.getElementById(`${formId}-phone`)?.focus();
      } else if (validationErrors.city) {
        document.getElementById(`${formId}-city`)?.focus();
      } else if (validationErrors.address) {
        document.getElementById(`${formId}-address`)?.focus();
      }
      return;
    }

    // Anti-Spam Rate Limiter
    const lastOrderTime = sessionStorage.getItem('allio_last_order_ts');
    if (lastOrderTime) {
      const diffSecs = (Date.now() - Number(lastOrderTime)) / 1000;
      if (diffSecs < 15) {
        setSubmissionError(currentLang === 'ar' 
          ? 'تم استلام طلبك السابق بنجاح. يرجى الانتظار بضع لحظات قبل إرسال طلب جديد.'
          : 'Your previous order was received. Please wait a moment before placing another.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const productNameLocalized = getLocalizedText(product.name, currentLang);
      const newOrder = await createOrder({
        storeId: product.storeId || store.id || 'store-default',
        productId: product.id,
        productName: productNameLocalized,
        customerName: customerName.trim(),
        phoneNumber: cleanPhone,
        city: city.trim(),
        address: address.trim(),
        quantity,
        unitPrice: product.price,
        shippingFee: 0,
        totalPrice,
        status: 'new',
        notes: notes.trim()
      });

      sessionStorage.setItem('allio_last_order_ts', Date.now().toString());

      trackPixelEvent('Purchase', product.fbPixelId, product.tiktokPixelId, {
        content_name: productNameLocalized,
        content_ids: [product.id],
        value: totalPrice,
        currency: 'MAD',
        num_items: quantity
      });

      onOrderSuccess(newOrder);
    } catch (err: unknown) {
      console.error('[Checkout Error] Order submission to Firebase failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(isRTL 
        ? `فشل إرسال الطلب إلى Firebase: ${errorMessage}` 
        : `Failed to submit order to Firebase: ${errorMessage}`);
      setSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smart Hiding for whole order form
  if (orderFormConfig?.enabled === false) {
    return null;
  }

  const formTitle = getLocalizedText(orderFormConfig?.title, currentLang) || t('order_form.title');
  const formSubtitle = getLocalizedText(orderFormConfig?.subtitle, currentLang) || t('order_form.subtitle');
  const callConfirmation = getLocalizedText(orderFormConfig?.callConfirmationText, currentLang) || t('order_form.call_confirmation');
  const freeShippingNote = getLocalizedText(orderFormConfig?.freeShippingText, currentLang) || t('order_form.free_shipping');
  const submitButtonText = getLocalizedText(orderFormConfig?.submitButtonText, currentLang) || t('order_form.submit_btn');
  const submitButtonSubtext = getLocalizedText(orderFormConfig?.submitButtonSubtext, currentLang) || t('order_form.submit_subtext');

  return (
    <div id="order-form-section" className="bg-white rounded-3xl border-2 border-emerald-500/30 p-5 md:p-8 shadow-xl max-w-xl mx-auto my-8 relative overflow-hidden">
      {/* Decorative Top Accent */}
      <div 
        className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
        style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
      />

      <div className="text-center space-y-1 mb-6">
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border"
          style={{ 
            backgroundColor: `${primaryColor}12`, 
            color: primaryColor,
            borderColor: `${primaryColor}30`
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{callConfirmation}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {formTitle}
        </h2>
        {formSubtitle && (
          <p className="text-sm text-slate-600">
            {formSubtitle}
          </p>
        )}
      </div>

      {submissionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <p>{submissionError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bundle Quantity Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            {t('order_form.quantity')}:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1 Piece */}
            <button
              type="button"
              onClick={() => setQuantity(1)}
              className={`p-3.5 rounded-xl border-2 text-start transition-all flex flex-col justify-between ${
                quantity === 1
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">{t('order_form.qty_1')}</span>
                {quantity === 1 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-slate-900">
                {product.price} <span className="text-xs font-normal">{t('common.currency')}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{t('order_form.free_shipping')}</span>
            </button>

            {/* 2 Pieces */}
            <button
              type="button"
              onClick={() => setQuantity(2)}
              className={`p-3.5 rounded-xl border-2 text-start transition-all flex flex-col justify-between relative overflow-hidden ${
                quantity === 2
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="absolute top-0 end-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-es-lg">
                ⭐ {isRTL ? 'الأكثر طلباً' : 'Popular'}
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">{t('order_form.qty_2')}</span>
                {quantity === 2 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-emerald-700">
                {getBundlePrice(2)} <span className="text-xs font-normal">{t('common.currency')}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">15% {t('landing.discount_badge', { percent: 15 })}</span>
            </button>

            {/* 3 Pieces */}
            <button
              type="button"
              onClick={() => setQuantity(3)}
              className={`p-3.5 rounded-xl border-2 text-start transition-all flex flex-col justify-between ${
                quantity === 3
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">{t('order_form.qty_3')}</span>
                {quantity === 3 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-emerald-700">
                {getBundlePrice(3)} <span className="text-xs font-normal">{t('common.currency')}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">25% {t('landing.discount_badge', { percent: 25 })}</span>
            </button>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="space-y-4 pt-2">
          {/* Full Name */}
          <div>
            <label htmlFor={`${formId}-name`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              {t('order_form.full_name')} <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              value={customerName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => handleBlur('customerName')}
              onFocus={handleFieldFocus}
              placeholder={t('order_form.full_name_placeholder')}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 text-sm md:text-base ${
                errors.customerName
                  ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-slate-900'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
              }`}
            />
            {errors.customerName && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{errors.customerName}</span>
              </p>
            )}
          </div>

          {/* Moroccan Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={`${formId}-phone`} className="block text-sm font-semibold text-slate-800">
                {t('order_form.phone_number')} <span className="text-red-500 font-bold">*</span>
              </label>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-emerald-600" />
                {t('order_form.call_confirmation')}
              </span>
            </div>
            
            <div className="relative">
              <input
                id={`${formId}-phone`}
                type="tel"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => handleBlur('phoneNumber')}
                onFocus={handleFieldFocus}
                placeholder={t('order_form.phone_number_placeholder')}
                maxLength={14}
                className={`w-full px-4 py-3 rounded-xl border text-left font-mono tracking-wider outline-none transition-all text-base ${
                  errors.phoneNumber
                    ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-slate-900'
                    : isPhoneValid
                    ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
                }`}
              />
              <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">🇲🇦 +212</span>
                {isPhoneValid && !errors.phoneNumber && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>

            {errors.phoneNumber && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{errors.phoneNumber}</span>
              </p>
            )}
            {!errors.phoneNumber && isPhoneValid && (
              <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{isRTL ? 'رقم هاتف مغربي صحيح ✓' : 'Valid Moroccan phone number ✓'}</span>
              </p>
            )}
          </div>

          {/* Moroccan City Dropdown */}
          <div>
            <label htmlFor={`${formId}-city`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              {t('order_form.city')} <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <select
                id={`${formId}-city`}
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onBlur={() => handleBlur('city')}
                onFocus={handleFieldFocus}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all appearance-none bg-white text-sm md:text-base cursor-pointer ${
                  errors.city
                    ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-slate-900'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
                }`}
              >
                <option value="">{t('order_form.select_city')}</option>
                {MOROCCAN_CITIES.map((c) => {
                  const cityName = isRTL ? c.nameAr : c.nameFr;
                  const altName = isRTL ? c.nameFr : c.nameAr;
                  return (
                    <option key={c.id} value={cityName}>
                      {cityName} ({altName}) — {c.shippingDelay}
                    </option>
                  );
                })}
              </select>
              <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            {errors.city ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{errors.city}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <Truck className="w-3 h-3 text-emerald-600" />
                <span>{freeShippingNote}</span>
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor={`${formId}-address`} className="block text-sm font-semibold text-slate-800 mb-1.5">
              {t('order_form.address')} <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              id={`${formId}-address`}
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={() => handleBlur('address')}
              onFocus={handleFieldFocus}
              placeholder={t('order_form.address_placeholder')}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all placeholder:text-slate-400 text-sm md:text-base ${
                errors.address
                  ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-slate-900'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900'
              }`}
            />
            {errors.address && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={`${formId}-notes`} className="block text-xs font-medium text-slate-600 mb-1">
              {t('order_form.notes')}:
            </label>
            <input
              id={`${formId}-notes`}
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('order_form.notes_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Price Summary Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between items-center text-slate-600">
            <span>{t('order_form.product_price')} ({quantity}):</span>
            <span className="font-semibold text-slate-800">{totalPrice} {t('common.currency')}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>{t('order_form.shipping')}:</span>
            <span className="text-emerald-700 font-bold">{t('order_form.free_shipping')}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between items-center text-amber-700 text-xs">
              <span>{t('order_form.you_save')}:</span>
              <span className="font-bold">-{savings} {t('common.currency')}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-base font-black text-slate-900">
            <span>{t('order_form.total')}:</span>
            <span className="text-2xl text-emerald-700 font-black">
              {totalPrice} <span className="text-sm font-semibold">{t('common.currency')}</span>
            </span>
          </div>
        </div>

        {/* Animated High-Converting CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl text-white font-black text-lg md:text-xl shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 flex flex-col items-center justify-center gap-1 group animate-cod-cta hover:opacity-95"
            style={{
              backgroundColor: orderFormConfig?.submitButtonColor || primaryColor,
              color: orderFormConfig?.submitButtonTextColor || '#ffffff'
            }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span>
                {isSubmitting ? t('order_form.submitting') : submitButtonText}
              </span>
            </div>
            {submitButtonSubtext && (
              <span className="text-xs md:text-sm font-normal text-white/90 flex items-center gap-1.5">
                <span>{submitButtonSubtext}</span>
              </span>
            )}
          </button>
        </div>

        {/* Moroccan Trust & Guarantees Badges */}
        {(() => {
          const b1 = {
            title: getLocalizedText(orderFormConfig?.trustBadge1Title, currentLang) || t('order_form.trust_delivery_title'),
            sub: getLocalizedText(orderFormConfig?.trustBadge1Sub, currentLang) || t('order_form.trust_delivery_sub'),
            icon: Truck
          };
          const b2 = {
            title: getLocalizedText(orderFormConfig?.trustBadge2Title, currentLang) || t('order_form.trust_cod_title'),
            sub: getLocalizedText(orderFormConfig?.trustBadge2Sub, currentLang) || t('order_form.trust_cod_sub'),
            icon: ShieldCheck
          };
          const b3 = {
            title: getLocalizedText(orderFormConfig?.trustBadge3Title, currentLang) || t('order_form.trust_guarantee_title'),
            sub: getLocalizedText(orderFormConfig?.trustBadge3Sub, currentLang) || t('order_form.trust_guarantee_sub'),
            icon: Check
          };
          const badges = [b1, b2, b3].filter(b => Boolean(b.title?.trim()));
          if (badges.length === 0) return null;

          return (
            <div className={`grid grid-cols-${badges.length} gap-2 pt-2 text-center text-xs text-slate-600 border-t border-slate-100`}>
              {badges.map((badge, idx) => {
                const IconComponent = badge.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
                    <IconComponent className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">{badge.title}</span>
                    {badge.sub && <span className="text-[10px] text-slate-500">{badge.sub}</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </form>
    </div>
  );
};
