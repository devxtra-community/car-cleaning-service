import React, { useState } from 'react';
import carlogo from '../assets/carlogo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loginInput, setLoginInput] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const user = await login(loginInput.email, loginInput.password);

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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src={carlogo} alt="Logo" className="h-16 w-auto object-contain" />
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-slate-600 text-sm">Sign in to access your dashboard</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  value={loginInput.email}
                  onChange={(e) => setLoginInput({ ...loginInput, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEFF] focus:border-transparent transition-all duration-200"
                  type="email"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  value={loginInput.password}
                  onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEFF] focus:border-transparent transition-all duration-200"
                  type="password"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#00AEFF] focus:ring-[#00AEFF] focus:ring-offset-0"
                  />
                  <span className="ml-2 text-slate-600">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-[#00AEFF] hover:text-[#0090d9] font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleLogin}
                className="w-full bg-linear-to-r from-[#00AEFF] to-[#0090d9] text-white py-3.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#00AEFF]/30 transition-all duration-300 ease-in-out flex items-center justify-center group"
              >
                <svg
                  className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign In</span>
              </button>

              {/* Terms */}
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By continuing, you agree to our{' '}
                <Link
                  to="/privacyPolicy"
                  className="text-[#00AEFF] hover:text-[#0090d9] font-medium transition-colors"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacyPolicy"
                  className="text-[#00AEFF] hover:text-[#0090d9] font-medium transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Image/Branding */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 bg-[url('./assets/carlogin.png')] bg-cover bg-center"></div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-[#00AEFF]/90 via-[#0090d9]/80 to-[#0077b6]/90"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white text-center">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-4">Streamline Your Fleet Management</h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Access powerful tools to manage your fleet operations, track performance, and
                optimize efficiency all in one place.
              </p>

              {/* Feature Pills */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="font-medium">Real-time Analytics</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="font-medium">Automated Workflows</span>
                </div>
                <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="font-medium">Secure & Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
