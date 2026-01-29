import React from 'react';
import carlogo from '../assets/carlogo.png';

import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center">
      <div className="w-full max-w-7xl bg-white shadow sm:rounded-lg flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-1/2 xl:w-5/12 p-6 sm:p-12 flex items-center justify-center">
          <div className="w-full max-w-xs">
            <img src={carlogo} className="w-22 mx-auto" />

            <h1 className="text-2xl xl:text-3xl font-extrabold text-center">Sign up</h1>

            <div className="mt-8">
              <label>Enter your email here</label>
              <input
                className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                type="email"
                placeholder="Email"
              />

              <label className="block mt-5">Enter your password here</label>
              <input
                className="w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                type="password"
                placeholder="Password"
              />

              <button className="mt-5 tracking-wide font-semibold bg-[#00AEFF] text-gray-100 w-full py-4 rounded-lg hover:bg-[#23b9ff] transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none">
                <svg
                  className="w-6 h-6 -ml-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
                <span className="ml-3">Sign Up</span>
              </button>

              <p className="mt-6 text-xs text-gray-600 text-center">
                I agree to the{' '}
                <Link to="/privacyPolicy" className="border-b border-gray-500 border-dotted">
                  Terms of Service
                </Link>{' '}
                and its{' '}
                <Link to="/privacyPolicy" className="border-b border-gray-500 border-dotted">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-[#00aeff1f] items-center justify-center bg-[url('./assets/carlogin.png')] bg-no-repeat bg-cover"></div>
      </div>
    </div>
  );
};

export default Login;
