import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, MessageSquareText, ReceiptText, ShieldCheck, Upload, ArrowLeftRight, Truck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, StoreSettings } from '../types';
import { defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

const OrderConfirmed = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        return;
      }

      try {
        const [orderSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'orders', orderId)),
          getDoc(doc(db, STOREFRONT_SETTINGS_DOC)),
        ]);

        if (!orderSnap.exists()) {
          navigate('/track-order', { replace: true });
          return;
        }

        setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);

        if (settingsSnap.exists()) {
          setSettings({ id: settingsSnap.id, ...defaultStoreSettings, ...(settingsSnap.data() as Omit<StoreSettings, 'id'>) });
        }
      } catch (error) {
        console.error('Failed to load confirmed order:', error);
      }
    };

    void load();
  }, [navigate, orderId]);

  const amount = order?.total || 0;
  const needsPaymentProof = order?.paymentMethod === 'Mobile Money' || order?.paymentMethod === 'Bank Transfer';
  const whatsappHref = useMemo(() => {
    if (!order) {
      return '#';
    }

    const cleanNumber = settings.supportWhatsapp.replace(/\D/g, '');
    const itemsSummary = order.items.map((item) => `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} x${item.quantity}`).join(', ');
    const customerName = order.shippingAddress.name;
    const zone = order.deliveryZone || order.shippingAddress.city;
    const message =
      order.paymentMethod === 'Pay on Delivery'
        ? [
            `Hello DTHC Team,`,
            ``,
            `I have placed a Pay on Delivery order and I am requesting confirmation for dispatch availability.`,
            ``,
            `Order Details:`,
            `Customer: ${customerName}`,
            `Tracking Code: ${order.trackingCode || 'Pending'}`,
            `Payment Method: ${order.paymentMethod}`,
            `Order Total: GHS ${amount.toFixed(2)}`,
            `Delivery Zone: ${zone}`,
            `Phone Number: ${order.shippingAddress.phone}`,
            `Items: ${itemsSummary}`,
            ``,
            `Please confirm whether this order qualifies for pay on delivery and share the next update. Thank you.`,
          ].join('\n')
        : [
            `Hello DTHC Team,`,
            ``,
            `I have completed payment for my order and I am sending my payment update for confirmation.`,
            ``,
            `Order Details:`,
            `Customer: ${customerName}`,
            `Tracking Code: ${order.trackingCode || 'Pending'}`,
            `Payment Method: ${order.paymentMethod}`,
            `Amount Paid: GHS ${amount.toFixed(2)}`,
            `Delivery Zone: ${zone}`,
            `Phone Number: ${order.shippingAddress.phone}`,
            `Items: ${itemsSummary}`,
            ``,
            `Please review my payment and confirm the next update on my order. Thank you.`,
          ].join('\n');

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }, [amount, order, settings.supportWhatsapp]);

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1800);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-black px-4 pt-24 pb-24 text-white">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-6 sm:p-8 text-center backdrop-blur-xl">
          <p className="text-lg text-white/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 md:pb-24 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
          <Link to="/checkout" className="text-white/60 transition-colors hover:text-orange-400">
            <ArrowLeftRight size={18} />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Order Confirmed</h1>
        </div>

        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 md:p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 items-center justify-center rounded-[2rem] bg-orange-500 text-black">
              <Check size={38} strokeWidth={3} className="sm:hidden" />
              <Check size={46} strokeWidth={3} className="hidden sm:block md:hidden" />
              <Check size={52} strokeWidth={3} className="hidden md:block" />
            </div>
            <h2 className="mt-6 md:mt-8 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Order Confirmed</h2>
            <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">Your order has been successfully placed.</p>

            <div className="mt-6 md:mt-8 rounded-[1.65rem] border border-white/10 bg-[rgba(15,15,17,0.5)] p-4 sm:p-5 md:p-6 text-left backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/40">Tracking Code</p>
              <p className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-orange-400 break-all">{order.trackingCode}</p>

              <div className="mt-4 md:mt-5 flex flex-wrap gap-2.5 md:gap-3">
                <CopyButton
                  label={copied === 'tracking' ? 'Copied' : 'Copy Tracking Code'}
                  onClick={() => handleCopy('tracking', order.trackingCode || '')}
                />
                <CopyButton
                  label={copied === 'amount' ? 'Copied' : 'Copy Amount'}
                  onClick={() => handleCopy('amount', `GHS ${amount.toFixed(2)}`)}
                />
              </div>

              <div className="mt-5 md:mt-6 rounded-[1.35rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4 sm:p-5">
                <p className="text-lg sm:text-xl md:text-2xl font-bold">Payment Method: {order.paymentMethod}</p>
                <p className="mt-2 md:mt-3 text-lg sm:text-xl md:text-2xl font-bold">Amount: GHS {amount.toFixed(2)}</p>
              </div>
            </div>
          </section>

          {order.paymentMethod === 'Mobile Money' && (
            <section className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-orange-400">Mobile Money Payment Details</h3>
              <div className="mt-4 md:mt-5 space-y-3">
                <InfoLine label="MoMo Number" value={settings.mobileMoneyNumber} highlight />
                <InfoLine label="Name" value={settings.mobileMoneyName} />
                <InfoLine label="Reference" value={order.trackingCode || ''} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5 md:gap-3">
                <CopyButton label={copied === 'momo' ? 'Copied' : 'Copy MoMo Number'} onClick={() => handleCopy('momo', settings.mobileMoneyNumber)} />
                <CopyButton label={copied === 'name' ? 'Copied' : 'Copy Name'} onClick={() => handleCopy('name', settings.mobileMoneyName)} />
                <CopyButton label={copied === 'reference' ? 'Copied' : 'Copy Reference'} onClick={() => handleCopy('reference', order.trackingCode || '')} />
              </div>
              <p className="mt-4 md:mt-5 text-xs sm:text-sm leading-6 md:leading-7 text-white/55">Use your tracking code as the payment reference when sending payment.</p>
            </section>
          )}

          {order.paymentMethod === 'Bank Transfer' && (
            <section className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-black">
                  <ReceiptText size={24} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Bank Transfer Instructions</h3>
                  <p className="mt-3 text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">
                    DTHC will confirm the bank transfer details, expected amount, and payment reference after the order review.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4 sm:p-5 text-sm sm:text-base leading-7 md:leading-8 text-white/60">
                Please keep your tracking code safe. Once your transfer is completed, send your payment proof so admin can verify it quickly.
              </div>
            </section>
          )}

          {order.paymentMethod === 'Pay on Delivery' && (
            <section className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-orange-400">Pay on Delivery</h3>
              <p className="mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/60">
                DTHC will confirm whether pay on delivery is available for your location before dispatch.
              </p>
            </section>
          )}

          <div className="space-y-2.5 md:space-y-3">
            {needsPaymentProof && (
              <Link
                to={`/upload-payment-proof/${order.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[rgba(24,24,27,0.74)] px-5 py-3.5 md:px-6 md:py-4 text-base md:text-lg font-bold text-white transition-colors hover:bg-zinc-800/80"
              >
                <Upload size={18} />
                Upload Payment Proof
              </Link>
            )}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3.5 md:px-6 md:py-4 text-base md:text-lg font-bold text-black transition-colors hover:bg-orange-400"
            >
              <MessageSquareText size={18} />
              {needsPaymentProof ? 'Send Payment Update on WhatsApp' : 'Send Order Update on WhatsApp'}
            </a>
            <Link
              to={`/track-order?tracking=${encodeURIComponent(order.trackingCode || '')}&phone=${encodeURIComponent(order.shippingAddress.phone || '')}`}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-orange-500 bg-transparent px-5 py-3.5 md:px-6 md:py-4 text-base md:text-lg font-bold text-orange-400 transition-colors hover:bg-orange-500/10"
            >
              <ShieldCheck size={18} />
              Track Order
            </Link>
            <Link to="/shop" className="block pt-2 text-center text-base md:text-lg font-semibold text-white/80 transition-colors hover:text-orange-400">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const CopyButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(9,9,11,0.34)] px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-base font-semibold text-white transition-colors hover:bg-zinc-900/80"
  >
    <Copy size={16} />
    {label}
  </button>
);

const InfoLine = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-[1.15rem] border px-4 py-3.5 md:py-4 ${highlight ? 'border-orange-500 bg-[rgba(249,115,22,0.05)]' : 'border-white/10 bg-[rgba(9,9,11,0.34)]'}`}>
    <span className="text-sm sm:text-base md:text-lg font-semibold text-white/55">{label}</span>
    <span className={`text-lg sm:text-xl md:text-2xl font-black break-all ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</span>
  </div>
);

export default OrderConfirmed;
