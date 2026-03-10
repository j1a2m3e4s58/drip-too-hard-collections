import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, 'contacts'), {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Info Side */}
          <div className="space-y-12">
            <div className="space-y-6">
              <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Get In<br /><span className="text-orange-500">Touch</span></h1>
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-md">
                Have a question about a drop? Need help with an order? Our team is ready to assist you.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Email Us</h3>
                  <p className="text-sm font-bold uppercase tracking-tight">support@dthc.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Call Us</h3>
                  <p className="text-sm font-bold uppercase tracking-tight">+233 24 000 0000</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Visit Us</h3>
                  <p className="text-sm font-bold uppercase tracking-tight">Osu, Accra, Ghana</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Hours</h3>
                  <p className="text-sm font-bold uppercase tracking-tight">Mon - Sat: 9AM - 8PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-zinc-900 border border-white/10 p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <MessageSquare size={120} />
            </div>

            {isSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-black">
                  <Send size={32} />
                </div>
                <h2 className="text-3xl font-black uppercase italic">Message Sent</h2>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest">We'll get back to you within 24 hours.</p>
                <button onClick={() => setIsSuccess(false)} className="text-orange-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Send another message</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Full Name</label>
                    <input required name="name" type="text" className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Email Address</label>
                    <input required name="email" type="email" className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Subject</label>
                  <input required name="subject" type="text" className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Message</label>
                  <textarea required name="message" rows={6} className="w-full bg-black border border-white/10 px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors resize-none" />
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
