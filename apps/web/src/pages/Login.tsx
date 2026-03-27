import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import carlogo from '../assets/carlogo.png';
import bgVideo from '../assets/bg-video.mp4';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../context/AlertContext';
import ForgotPasswordModal from '../components/admin/Forgotpasswordmodal';

/**
 * Premium Login Component with Video Background & True Glassmorphism
 */
const Login = () => {
  const [loginInput, setLoginInput] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showAlert, showToast } = useAlert();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(loginInput.email, loginInput.password);

      showToast('Login successful! Welcome back.', 'success');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginInput.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (user.role === 'accountant') {
        navigate('/accountant/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login failed', error);
      showToast('Access denied. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* --- VIDEO BACKGROUND LAYER --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      
      {/* --- DARK OVERLAY FOR GLASS --- */}
      <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply z-0"></div>
      <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay z-0"></div>

      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

      {/* --- LOGIN CARD (TRUE GLASSMORPHISM) --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-10 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          
          {/* Branding */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center mb-10"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 border border-white/20 transform hover:rotate-6 transition-transform duration-300">
              <img src={carlogo} alt="Logo" className="h-10 w-auto invert brightness-0" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center drop-shadow-sm">
              CAR WASH <span className="text-blue-400">PRO</span>
            </h1>
            <p className="text-slate-300 font-medium mt-2 text-sm text-center">
              Intelligent Management Systems
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-2"
            >
              <label className="text-[11px] font-bold text-slate-300 ml-1 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors">
                Email Address
              </label>
              <div className="relative group">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  required
                  value={loginInput.email}
                  onChange={(e) => setLoginInput({ ...loginInput, email: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.04] border border-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-inner"
                  type="email"
                  placeholder="admin@carwash.com"
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors tracking-tight"
                >
                  FORGOT?
                </button>
              </div>
              <div className="relative group">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  required
                  value={loginInput.password}
                  onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                  className="w-full pl-12 pr-14 py-4 rounded-2xl bg-white/[0.04] border border-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:bg-white/[0.08] focus:border-white/20 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-inner"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Additional Options */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center px-1"
            >
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border border-white/20 rounded-lg group-hover:border-white/40 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200 bg-white/5"></div>
                  <svg
                    className="absolute w-3.5 h-3.5 text-white top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ml-3 text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
                  Remember my session
                </span>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(37,99,235,0.5)] hover:bg-blue-500 hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.6)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group border border-blue-500/50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              By accessing you agree to our{' '}
              <Link
                to="/privacyPolicy"
                className="text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
