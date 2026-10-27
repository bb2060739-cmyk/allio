import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Order, Product } from '../../types';
import { CheckCircle2, Truck, ShieldCheck, ArrowRight, ArrowLeft, Package, Clock } from 'lucide-react';

interface ThankYouPageProps {
  order: Order;
  product?: Product;
  onBackToHome: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  order,
  product,
  onBackToHome
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const isRTL = currentLang === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Main Success Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xl text-center space-y-5">
          {/* Animated Success Badge */}
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              <span>{t('thank_you.order_number')}: {order.orderNumber}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              {t('thank_you.title')}
            </h1>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              {t('thank_you.subtitle')}
            </p>
          </div>

          {/* Delivery Process Explainer */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-start space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{isRTL ? 'الخطوة التالية لتأكيد التوصيل:' : 'Next Step for Delivery Confirmation:'}</span>
            </div>
            <div className="text-xs md:text-sm text-emerald-800 space-y-2 ps-4 border-s-2 border-emerald-300">
              <p>
                📞 <strong>{isRTL ? 'مكالمة هاتفية:' : 'Phone Call:'}</strong>{' '}
                {isRTL 
                  ? `سيتصل بكم أحد مسؤولي خدمة الزبائن أو الموزع في مدينة ${order.city} لتأكيد العنوان وموعد التسليم.`
                  : `A customer support agent will call you in ${order.city} to confirm the delivery address and time.`}
              </p>
              <p>
                📦 <strong>{isRTL ? 'المعاينة قبل الدفع:' : 'Inspection before payment:'}</strong>{' '}
                {isRTL
                  ? 'يحق لكم فحص المنتج والتأكد من جودته ومطابقته قبل دفع أي درهم للموزع.'
                  : 'You have full right to inspect the product before paying the courier cash.'}
              </p>
            </div>
          </div>

          {/* Itemized Order Receipt */}
          <div className="border-t border-slate-200 pt-5 text-start space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{t('order_form.order_summary')}:</span>
            </h3>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-xs md:text-sm text-slate-700 border border-slate-200">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('thank_you.product_ordered')}:</span>
                <span className="font-semibold text-slate-900">{order.productName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('thank_you.quantity')}:</span>
                <span className="font-semibold">{order.quantity}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('order_form.full_name')}:</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('thank_you.phone')}:</span>
                <span className="font-mono font-bold text-emerald-800" dir="ltr">{order.phoneNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('thank_you.delivery_city')}:</span>
                <span className="font-semibold">{order.city} ({t('order_form.free_shipping')})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('thank_you.delivery_address')}:</span>
                <span className="font-semibold max-w-[220px] text-end truncate">{order.address}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-black text-slate-900">
                <span>{t('thank_you.total_due')}:</span>
                <span className="text-emerald-700 text-lg font-black">{order.totalPrice} {t('common.currency')}</span>
              </div>
            </div>
          </div>

          {/* Tracking Pixels Confirmation Info */}
          {(product?.fbPixelId || product?.tiktokPixelId) && (
            <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 text-start">
              <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Pixel Tracking:</span>
                <span className="text-emerald-600 font-bold">✓ Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Purchase event registered ({order.totalPrice} {t('common.currency')}) for campaign attribution.
              </p>
            </div>
          )}

          {/* Return button */}
          <div className="pt-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <BackArrow className="w-4 h-4" />
              <span>{t('thank_you.back_to_catalog')}</span>
            </button>
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="grid grid-cols-2 gap-3 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>{t('order_form.trust_delivery_title')}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('order_form.trust_guarantee_title')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
