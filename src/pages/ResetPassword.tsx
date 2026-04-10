import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../firebase';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await requestPasswordReset(email.trim());
      setSuccess('Password reset email sent. Check your inbox and spam folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-20 text-white">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-white/10 bg-[linear-gradient(145deg,rgba(24,24,27,0.96),rgba(10,10,10,0.96))] p-6 sm:p-8 lg:p-10"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Password Reset</p>
          <h1 className="mt-4 text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
            Reset Your Password Without Losing Your Member Access.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/62">
            We’ll send a reset link to your registered email so you can regain access to your order history, saved perks,
            and private customer inbox updates.
          </p>

          <div className="mt-8 border border-orange-500/20 bg-orange-500/10 p-4">
            <div className="flex items-center gap-3 text-orange-300">
              <ShieldCheck size={18} />
              <p className="text-xs font-black uppercase tracking-[0.22em]">Member Reminder</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Shopping without signing in still works. Resetting your password simply restores your member inbox, saved
              order history, and your DTHC10 welcome offer visibility inside your profile.
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
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400">Reset Password</p>
            <h2 className="mt-3 text-3xl font-black uppercase italic tracking-tight">Send Reset Link</h2>
          </div>

          {error && <div className="mb-4 border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {success && <div className="mb-4 border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-200">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Account Email</span>
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

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-white disabled:opacity-60"
            >
              <RefreshCcw size={16} />
              <span>{busy ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <Link to="/login" className="inline-flex items-center gap-2 transition-colors hover:text-orange-400">
              <ArrowLeft size={14} />
              <span>Back To Sign In</span>
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

export default ResetPassword;
