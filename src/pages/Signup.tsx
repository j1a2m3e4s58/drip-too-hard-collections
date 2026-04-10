import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Mail, Phone, ShieldCheck, User, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirebaseAuthMessage, signUpWithEmail } from '../firebase';

const Signup = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wantsOffers, setWantsOffers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signUpWithEmail({
        displayName,
        phone,
        email,
        password,
        wantsOffers,
      });
      navigate('/profile');
    } catch (err) {
      setError(getFirebaseAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-white/10 bg-[linear-gradient(145deg,rgba(24,24,27,0.96),rgba(10,10,10,0.96))] p-6 sm:p-8 lg:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Join DTHC</p>
          <h1 className="mt-4 max-w-xl text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
            Create Your Account And Enter The Inner Circle.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/62">
            Signing up is not required for shopping, but it unlocks saved address convenience, order history,
            customer inbox updates, and exclusive member offers.
          </p>

          <div className="mt-8 space-y-4">
            {[
              'Your email goes straight into the admin customer list for support and private drop updates.',
              'You get DTHC10 saved as your welcome offer code in your account profile.',
              'Admin can send order and member messages directly to your in-app inbox.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 border border-white/10 bg-black/35 px-4 py-4">
                <CheckCircle2 size={18} className="mt-0.5 text-orange-400" />
                <p className="text-sm leading-6 text-white/72">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-orange-500/20 bg-orange-500/10 p-4">
            <div className="flex items-center gap-3 text-orange-300">
              <ShieldCheck size={18} />
              <p className="text-xs font-black uppercase tracking-[0.22em]">Member Welcome Offer</p>
            </div>
            <p className="mt-3 text-2xl font-black uppercase italic tracking-tight">DTHC10</p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Use it as your welcome perk while we continue expanding the full promo code system.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="border border-white/10 bg-zinc-950 p-6 sm:p-8"
        >
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Sign Up</p>
            <h2 className="mt-3 text-3xl font-black uppercase italic tracking-tight">Start Your Member Profile</h2>
          </div>

          {error && (
            <div className="mb-5 border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Full Name</span>
              <div className="flex items-center border border-white/10 bg-black/50 px-4">
                <User size={16} className="text-white/35" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none"
                  required
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Email</span>
                <div className="flex items-center border border-white/10 bg-black/50 px-4">
                  <Mail size={16} className="text-white/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Phone</span>
                <div className="flex items-center border border-white/10 bg-black/50 px-4">
                  <Phone size={16} className="text-white/35" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional phone"
                    className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none"
                  />
                </div>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Password</span>
              <div className="flex items-center border border-white/10 bg-black/50 px-4">
                <ShieldCheck size={16} className="text-white/35" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none"
                  required
                />
              </div>
            </label>

            <label className="flex items-start gap-3 border border-white/10 bg-black/35 px-4 py-4 text-sm text-white/72">
              <input
                type="checkbox"
                checked={wantsOffers}
                onChange={(e) => setWantsOffers(e.target.checked)}
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>Send me private drop alerts, member updates, and promo messages in-app and by email.</span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-60"
            >
              <UserPlus size={16} />
              <span>{busy ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <Link to="/login" className="transition-colors hover:text-orange-400">
              Already have an account?
            </Link>
            <Link to="/reset-password" className="inline-flex items-center gap-2 transition-colors hover:text-orange-400">
              <span>Need reset?</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Signup;
