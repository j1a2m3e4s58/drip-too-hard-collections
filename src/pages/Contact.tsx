import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ContactMessage, StoreSettings } from '../types';
import { defaultStoreSettings, STOREFRONT_SETTINGS_DOC } from '../lib/storefront';

const CONTACT_STORAGE_KEY = 'dthc-contact-message-id';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submitNotice, setSubmitNotice] = React.useState('');
  const [settings, setSettings] = React.useState<StoreSettings>({ id: 'settings', ...defaultStoreSettings });
  const [activeMessageId, setActiveMessageId] = React.useState(() => localStorage.getItem(CONTACT_STORAGE_KEY) || '');
  const [activeMessage, setActiveMessage] = React.useState<ContactMessage | null>(null);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, STOREFRONT_SETTINGS_DOC), (snap) => {
      if (snap.exists()) {
        setSettings({ id: snap.id, ...defaultStoreSettings, ...(snap.data() as Omit<StoreSettings, 'id'>) });
      }
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!activeMessageId) {
      setActiveMessage(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'contacts', activeMessageId), (snap) => {
      if (snap.exists()) {
        setActiveMessage({ id: snap.id, ...(snap.data() as Omit<ContactMessage, 'id'>) });
      }
    });

    return () => unsubscribe();
  }, [activeMessageId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitNotice('');
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const created = await addDoc(collection(db, 'contacts'), {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'new',
        adminReply: '',
      });
      localStorage.setItem(CONTACT_STORAGE_KEY, created.id);
      setActiveMessageId(created.id);
      form.reset();
      setIsSuccess(true);
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error instanceof Error ? error.message : String(error);
      setSubmitNotice(`Failed to send message. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-16 pt-24 text-white md:pb-24 md:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 md:gap-24">
          <div className="space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter sm:text-5xl md:text-6xl">
                {settings.contactHeadlineLineOne}
                <br />
                <span className="text-orange-500">{settings.contactHeadlineAccent}</span>
              </h1>
              <p className="max-w-md text-xs font-bold uppercase leading-relaxed tracking-widest text-white/50 sm:text-sm">
                {settings.contactDescription}
              </p>
            </div>

            <div className="space-y-6 md:space-y-8">
              <InfoRow icon={Mail} label="Email Us" value={settings.contactEmail} />
              <InfoRow icon={Phone} label="Call Us" value={settings.contactPhone} />
              <InfoRow icon={MapPin} label="Visit Us" value={settings.contactAddress} />
              <InfoRow icon={Clock} label="Hours" value={settings.contactHours} />
            </div>
          </div>

          <div className="relative overflow-hidden border border-white/10 bg-zinc-900 p-5 sm:p-8 md:p-12">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <MessageSquare size={120} />
            </div>

            {submitNotice && (
              <div className="relative z-10 mb-5 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                {submitNotice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
                <Field label="Full Name">
                  <input required name="name" type="text" className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500" />
                </Field>
                <Field label="Email Address">
                  <input required name="email" type="email" className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500" />
                </Field>
              </div>
              <Field label="Subject">
                <input required name="subject" type="text" className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500" />
              </Field>
              <Field label="Message">
                <textarea required name="message" rows={6} className="w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500" />
              </Field>
              <button
                disabled={isSubmitting}
                className="flex w-full items-center justify-center space-x-3 bg-white py-4 font-black uppercase tracking-widest text-black transition-all hover:bg-orange-500 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                <Send size={18} />
              </button>
            </form>

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/82 px-6 backdrop-blur-md"
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full max-w-md border border-white/10 bg-zinc-950/90 p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.48)]"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center bg-orange-500 text-black">
                    <Send size={30} />
                  </div>
                  <h2 className="mt-6 text-2xl font-black uppercase italic md:text-3xl">{settings.contactSuccessHeadline}</h2>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/60">
                    Your message has been received. We will reply here once our team responds.
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/45">
                    {settings.contactSuccessMessage}
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 inline-flex items-center justify-center border border-white/10 px-5 py-3 font-bold uppercase tracking-widest text-orange-500 transition-colors hover:border-orange-500 hover:text-white"
                  >
                    Continue
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {activeMessage && (
          <div className="mt-10 border border-white/10 bg-zinc-900 p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <MessageSquare className="text-orange-500" size={22} />
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl">Your Message Thread</h2>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Saved on this device for easy follow-up</p>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="border border-white/10 bg-black p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">Your Message</p>
                <h3 className="mt-3 text-lg font-bold">{activeMessage.subject}</h3>
                <p className="mt-2 text-sm text-white/55">{activeMessage.email}</p>
                <p className="mt-4 text-sm leading-7 text-white/78">{activeMessage.message}</p>
                <div className="mt-5 inline-flex border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Status: {activeMessage.status || 'new'}
                </div>
              </div>
              <div className="border border-white/10 bg-black p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">Admin Reply</p>
                {activeMessage.adminReply ? (
                  <>
                    <p className="mt-4 text-sm leading-7 text-white/78">{activeMessage.adminReply}</p>
                    <div className="mt-5 inline-flex border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">
                      Replied
                    </div>
                  </>
                ) : (
                  <div className="mt-4 border border-white/10 bg-zinc-950 p-4 text-sm leading-7 text-white/45">
                    No reply yet. When admin responds, the message will appear here automatically.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start space-x-4 md:space-x-6">
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-white/10 bg-zinc-900">
      <Icon className="text-orange-500" size={20} />
    </div>
    <div>
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/30">{label}</h3>
      <p className="text-sm font-bold uppercase tracking-tight">{value}</p>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</label>
    {children}
  </div>
);

export default Contact;
