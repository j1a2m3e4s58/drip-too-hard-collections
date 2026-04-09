import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Loader2, MapPin, PackageCheck, Phone, Search, ShieldCheck, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { Order } from '../types';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [result, setResult] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const statusTone = useMemo(() => {
    if (!result) return 'text-white/55';
    if (result.status === 'Delivered') return 'text-emerald-400';
    if (result.status === 'Cancelled') return 'text-red-400';
    if (result.status === 'Shipped') return 'text-orange-400';
    return 'text-yellow-300';
  }, [result]);

  useEffect(() => {
    const tracking = searchParams.get('tracking') || '';
    const phone = searchParams.get('phone') || '';
    if (!tracking && !phone) {
      return;
    }

    setTrackingCode(tracking);
    setPhoneNumber(phone);
  }, [searchParams]);

  useEffect(() => {
    const tracking = searchParams.get('tracking') || '';
    const phone = searchParams.get('phone') || '';

    if (!tracking && !phone) {
      return;
    }

    const runSearch = async () => {
      setBusy(true);
      setError('');
      setResult(null);

      try {
        let found: Order | null = null;

        if (tracking) {
          const trackingSnapshot = await getDocs(query(collection(db, 'orders'), where('trackingCode', '==', tracking), limit(1)));
          if (!trackingSnapshot.empty) {
            found = { id: trackingSnapshot.docs[0].id, ...trackingSnapshot.docs[0].data() } as Order;
          }
        }

        if (!found && phone) {
          const phoneSnapshot = await getDocs(query(collection(db, 'orders'), where('shippingAddress.phone', '==', phone), limit(10)));
          const phoneMatches = phoneSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Order[];

          if (tracking) {
            found = phoneMatches.find((item) => item.trackingCode === tracking) || null;
          } else {
            found = phoneMatches.sort((a, b) => {
              const aTime = a.createdAt?.seconds || 0;
              const bTime = b.createdAt?.seconds || 0;
              return bTime - aTime;
            })[0] || null;
          }
        }

        if (!found) {
          setError('No order matched those details.');
          return;
        }

        setResult(found);
      } catch (searchError) {
        console.error('Track order search failed:', searchError);
        setError('Could not check your order right now. Please try again.');
      } finally {
        setBusy(false);
      }
    };

    void runSearch();
  }, [searchParams]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTracking = trackingCode.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedTracking && !trimmedPhone) {
      setError('Enter your tracking code or phone number.');
      setResult(null);
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {
      let found: Order | null = null;

      if (trimmedTracking) {
        const trackingSnapshot = await getDocs(query(collection(db, 'orders'), where('trackingCode', '==', trimmedTracking), limit(1)));
        if (!trackingSnapshot.empty) {
          found = { id: trackingSnapshot.docs[0].id, ...trackingSnapshot.docs[0].data() } as Order;
        }
      }

      if (!found && trimmedPhone) {
        const phoneSnapshot = await getDocs(query(collection(db, 'orders'), where('shippingAddress.phone', '==', trimmedPhone), limit(10)));
        const phoneMatches = phoneSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Order[];

        if (trimmedTracking) {
          found = phoneMatches.find((item) => item.trackingCode === trimmedTracking) || null;
        } else {
          found = phoneMatches.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })[0] || null;
        }
      }

      if (!found) {
        setError('No order matched those details.');
        return;
      }

      setResult(found);
    } catch (searchError) {
      console.error('Track order search failed:', searchError);
      setError('Could not check your order right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const clearSearch = () => {
    setTrackingCode('');
    setPhoneNumber('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-7 backdrop-blur-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Track Your Order</h1>
          <p className="mt-4 max-w-4xl text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">
            Use your tracking code or phone number to check your current DTHC order progress, payment updates, and delivery status.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.15fr]">
          <form onSubmit={handleSearch} className="self-start rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Search Details</h2>
            <p className="mt-3 text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">
              For best results, enter your tracking code. You can also add your phone number.
            </p>

            <div className="mt-6 space-y-4">
              <InputRow
                icon={Truck}
                placeholder="Tracking Code"
                value={trackingCode}
                onChange={setTrackingCode}
              />
              <InputRow
                icon={Phone}
                placeholder="Phone Number (optional)"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-red-400">{error}</p>}

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-base font-bold text-black transition-colors hover:bg-orange-400 disabled:opacity-60"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                Track Order
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-full border border-white/10 bg-[rgba(9,9,11,0.28)] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-zinc-900/80"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Order Status</h2>
            {!result ? (
              <p className="mt-4 text-sm sm:text-base md:text-lg leading-7 md:leading-8 text-white/55">Your order result will appear here after you search.</p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-5 backdrop-blur-md">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/40">Order Status</p>
                      <h3 className={`mt-2 text-2xl sm:text-3xl font-black ${statusTone}`}>{result.status}</h3>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-semibold text-white/70">
                      {result.trackingCode || 'Tracking code pending'}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <InfoTile icon={PackageCheck} label="Payment" value={result.paymentStatus || 'Pending'} />
                    <InfoTile icon={ShieldCheck} label="Proof" value={result.paymentProofStatus || 'Not Sent'} />
                    <InfoTile icon={Truck} label="Update" value={result.orderUpdateStatus || 'Not Sent'} />
                    <InfoTile icon={MapPin} label="Delivery Zone" value={result.deliveryZone || `${result.shippingAddress.city}, ${result.shippingAddress.region}`} />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/40">Customer Details</p>
                  <div className="mt-4 space-y-2 text-white/80">
                    <p>{result.shippingAddress.name}</p>
                    <p>{result.shippingAddress.phone}</p>
                    <p>{result.shippingAddress.address}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/40">Ordered Items</p>
                  <div className="mt-4 space-y-3">
                    {result.items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex items-center gap-4 rounded-[1.15rem] border border-white/10 bg-[rgba(39,39,42,0.6)] p-3 backdrop-blur-sm">
                          <img src={item.image} alt={item.name} className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover" />
                          <div className="flex-1">
                            <p className="text-base sm:text-lg font-bold">{item.name}</p>
                            <p className="text-sm text-orange-400">Qty {item.quantity}</p>
                            {item.selectedSize && <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Size {item.selectedSize}</p>}
                          </div>
                          <p className="text-sm font-semibold text-white/75">GHS {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputRow = ({
  icon: Icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex h-[54px] sm:h-[58px] items-center rounded-[18px] border border-white/10 bg-[rgba(39,39,42,0.72)] px-4 backdrop-blur-md">
    <Icon size={18} className="mr-3 text-orange-400" />
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[14px] sm:text-[15px] font-medium outline-none placeholder:text-white/35"
    />
  </div>
);

const InfoTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="rounded-[1.15rem] border border-white/10 bg-[rgba(39,39,42,0.58)] p-3.5 sm:p-4 backdrop-blur-sm">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-orange-400" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{label}</p>
    </div>
    <p className="mt-3 text-base sm:text-lg font-bold text-white/85">{value}</p>
  </div>
);

export default TrackOrder;
