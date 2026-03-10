import React from 'react';
import { motion } from 'motion/react';
import { LogIn, ShoppingBag } from 'lucide-react';
import { signInWithGoogle, ensureUserProfileDocument } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      await ensureUserProfileDocument(result.user);
      navigate('/profile');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900 border border-white/5 p-12 text-center"
      >
        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShoppingBag size={40} className="text-black" />
        </div>
        <h1 className="text-4xl font-black uppercase italic mb-4 tracking-tighter">Join the Drop</h1>
        <p className="text-white/50 mb-12 text-xs uppercase tracking-widest font-bold">
          Sign in to track your orders, manage your wishlist, and get early access to new collections.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-4 text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center space-x-3"
        >
          <LogIn size={18} />
          <span>Continue with Google</span>
        </button>
        
        <p className="mt-8 text-[10px] text-white/30 uppercase tracking-widest font-bold">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;