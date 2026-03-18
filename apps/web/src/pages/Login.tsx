import React, { useState } from 'react';
import carlogo from '../assets/carlogo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/admin/Forgotpasswordmodal';

const Login = () => {
  const [loginInput, setLoginInput] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const user = await login(loginInput.email, loginInput.password);

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
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="w-full max-w-5xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] flex flex-col lg:flex-row overflow-hidden relative z-10 transition-all duration-500 hover:border-white/20">
        {/* Left Panel - Login Form */}
        <div className="w-full lg:w-[45%] p-10 sm:p-14 flex flex-col items-center justify-center bg-white">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-10 transform transition-transform hover:scale-105 duration-300">
              <img src={carlogo} alt="Logo" className="h-14 w-auto drop-shadow-sm" />
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-500 font-medium">Please enter your details to sign in</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  value={loginInput.email}
                  onChange={(e) => setLoginInput({ ...loginInput, email: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-300"
                  type="email"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors tracking-tight"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  value={loginInput.password}
                  onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-slate-300"
                  type="password"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center px-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200"></div>
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
                  <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    Keep me signed in
                  </span>
                </label>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] hover:bg-blue-600 hover:shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center"
              >
                <span>Access Dashboard</span>
                <svg className="w-4 h-4 ml-2 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="pt-4 text-center">
                <p className="text-[12px] text-slate-400 font-medium">
                  By signing in, you agree to our{' '}
                  <Link
                    to="/privacyPolicy"
                    className="text-slate-900 hover:underline decoration-blue-500 underline-offset-4 decoration-2 transition-all"
                  >
                    Terms
                  </Link>
                  {' & '}
                  <Link
                    to="/privacyPolicy"
                    className="text-slate-900 hover:underline decoration-blue-500 underline-offset-4 decoration-2 transition-all"
                  >
                    Privacy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Visual/Branding */}
        <div className="hidden lg:flex flex-1 relative bg-slate-900 border-l border-white/5">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>

          <div className="relative z-10 w-full h-full flex flex-col justify-end p-16">
            <div className="max-w-md">
              <div className="w-12 h-1 bg-blue-500 mb-8 rounded-full"></div>
              <h2 className="text-4xl font-black text-white leading-[1.1] mb-6 tracking-tighter italic">
                SMART FLEET
                <br />
                <span className="text-blue-500 not-italic">MANAGEMENT</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10">
                Experience the next generation of fleet operations with real-time tracking,
                automated workflows, and high-performance analytics.
              </p>

              <div className="flex gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex-1 text-center">
                  <div className="text-white text-xl font-black mb-1">100%</div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Accuracy
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex-1 text-center">
                  <div className="text-white text-xl font-black mb-1">24/7</div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Support
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex-1 text-center">
                  <div className="text-white text-xl font-black mb-1">PRO</div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Security
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
