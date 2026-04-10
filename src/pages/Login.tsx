import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, KeyRound, LogIn, Mail, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ensureUserProfileDocument, signInWithEmail, signInWithGoogle } from '../firebase';

const perks = [
  'Get private drop alerts and early access messages.',
  'Keep your wishlist, orders, and profile synced across devices.',
  'Unlock the member welcome offer code DTHC10.',
];

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState('');

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('email');
    setError('');
    try {
      const result = await signInWithEmail(email.trim(), password);
      await ensureUserProfileDocument(result.user);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setBusy(null);
    }
  };

  const handleGoogleLogin = async () => {
    setBusy('google');
    setError('');
    try {
      const result = await signInWithGoogle();
      await ensureUserProfileDocument(result.user);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue with Google right now.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden border border-white/10 bg-[linear-gradient(145deg,rgba(24,24,27,0.96),rgba(10,10,10,0.96))] p-6 sm:p-8 lg:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Member Access</p>
          <h1 className="mt-4 max-w-xl text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
            Sign In To Keep Your DTHC Experience Synced.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/62">
            Shopping stays open to everyone. Signing in simply unlocks saved orders, private drops, member-only messages,
            and repeat checkout comfort.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {perks.map((perk) => (
              <div key={perk} className="border border-white/10 bg-black/40 p-4">
                <Sparkles size={16} className="text-orange-400" />
                <p className="mt-3 text-sm leading-6 text-white/70">{perk}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-orange-500/20 bg-orange-500/10 p-4">
            <div className="flex items-center gap-3 text-orange-300">
              <ShieldCheck size={18} />
              <p className="text-xs font-black uppercase tracking-[0.22em]">Member Special Offer</p>
            </div>
            <p className="mt-3 text-xl font-black uppercase italic tracking-tight">Use code DTHC10 after sign up.</p>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Members are first in line for curated offers, message alerts from admin, faster re-checkout, and order history.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/40">
            <ShoppingBag size={14} className="text-orange-400" />
            <span>Guest shopping still works without signing in.</span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="border border-white/10 bg-zinc-950 p-6 sm:p-8"
        >
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Sign In</p>
            <h2 className="mt-3 text-3xl font-black uppercase italic tracking-tight">Welcome Back</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">
              Continue with your email and password, or use Google if that’s more comfortable.
            </p>
          </div>

          {error && (
            <div className="mb-5 border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Password</span>
              <div className="flex items-center border border-white/10 bg-black/50 px-4">
                <KeyRound size={16} className="text-white/35" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-60"
            >
              <LogIn size={16} />
              <span>{busy === 'email' ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy !== null}
            className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:border-orange-500 hover:text-orange-400 disabled:opacity-60"
          >
            <ArrowRight size={15} />
            <span>{busy === 'google' ? 'Connecting...' : 'Continue With Google'}</span>
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <Link to="/reset-password" className="transition-colors hover:text-orange-400">
              Reset Password
            </Link>
            <Link to="/signup" className="transition-colors hover:text-orange-400">
              Create Account
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Login;
