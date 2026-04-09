import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Upload } from 'lucide-react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Order } from '../types';

const UploadPaymentProof = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        return;
      }

      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (!orderSnap.exists()) {
          navigate('/track-order', { replace: true });
          return;
        }

        setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
      } catch (error) {
        console.error('Failed to load payment proof page:', error);
      }
    };

    void load();
  }, [navigate, orderId]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const pageTitle = useMemo(() => {
    if (!order) {
      return 'Upload Payment Proof';
    }
    return `Upload your payment screenshot`;
  }, [order]);

  const handleUpload = async () => {
    if (!order || !orderId || !file) {
      return;
    }

    setIsUploading(true);

    try {
      const fileRef = ref(storage, `payment-proofs/${orderId}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      await updateDoc(doc(db, 'orders', orderId), {
        paymentProofUrl: downloadUrl,
        paymentProofStatus: 'Received',
        updatedAt: serverTimestamp(),
      });

      navigate(`/order-confirmed/${orderId}`);
    } catch (error) {
      console.error('Failed to upload payment proof:', error);
      const message = error instanceof Error ? error.message : String(error);
      setUploadNotice(`Could not upload payment proof right now. ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-black px-4 pt-24 pb-24 text-white">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-6 sm:p-8 text-center backdrop-blur-xl">
          <p className="text-lg text-white/60">Loading payment proof page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 md:pb-24 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
          <Link to={`/order-confirmed/${order.id}`} className="text-white/60 transition-colors hover:text-orange-400">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Upload Payment Proof</h1>
        </div>

        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[rgba(24,24,27,0.64)] p-5 sm:p-6 backdrop-blur-xl">
          {uploadNotice && (
            <div className="mb-5 rounded-[1.15rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {uploadNotice}
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">{pageTitle}</h2>
          <p className="mt-3 text-base sm:text-lg md:text-xl font-semibold text-orange-400 break-all">Tracking Code: {order.trackingCode}</p>
          <p className="mt-2 text-sm sm:text-base md:text-lg text-white/60">Payment Method: {order.paymentMethod}</p>

          <div className="mt-5 md:mt-6 rounded-[1.35rem] border border-white/10 bg-[rgba(9,9,11,0.34)] p-4 sm:p-5 text-sm sm:text-base leading-7 md:leading-8 text-white/65">
            Select a clear screenshot of your Mobile Money or bank transfer payment confirmation. Admin will review it from the dashboard.
          </div>

          <label className="mt-5 md:mt-6 flex min-h-[240px] sm:min-h-[300px] md:min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[1.65rem] border border-white/10 bg-[rgba(9,9,11,0.22)] p-5 sm:p-6 text-center transition-colors hover:border-orange-500/50">
            {preview ? (
              <img src={preview} alt="Payment proof preview" className="max-h-[420px] w-full rounded-[1.15rem] object-contain" />
            ) : (
              <>
                <ImagePlus size={38} className="text-orange-400 sm:hidden" />
                <ImagePlus size={46} className="hidden sm:block text-orange-400" />
                <p className="mt-4 sm:mt-6 text-lg sm:text-2xl font-bold text-white/80">No screenshot selected yet</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm sm:text-base font-bold text-black transition-colors hover:bg-orange-400">
              <ImagePlus size={18} />
              Select Screenshot
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            <button
              type="button"
              disabled={!file || isUploading}
              onClick={handleUpload}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-orange-500 bg-transparent px-5 py-3 text-sm sm:text-base font-bold text-orange-400 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
            >
              <Upload size={18} />
              {isUploading ? 'Uploading...' : 'Upload Payment Proof'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPaymentProof;
