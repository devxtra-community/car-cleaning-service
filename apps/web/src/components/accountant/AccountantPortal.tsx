import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  TruckIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  GiftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const AccountantPortal = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('accountantPortal: Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Show nothing while loading to prevent flicker
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-sm flex flex-col">
        {/* Logo - Fixed at top */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img width={32} height={32} src="/appLogo.png" alt="appLogo" className="rounded" />
            <p className="font-semibold text-gray-900">Car Cleaning</p>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <NavLink to="/accountant/dashboard">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HomeIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Dashboard</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/buildings">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BuildingOffice2Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Buildings</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/vechicles">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TruckIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Vehicle Management</span>
              </div>
            )}
          </NavLink>

          {/* Salary Section Divider */}
          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Salary Management
            </p>
          </div>

          <NavLink to="/accountant/addNewSalary">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CurrencyRupeeIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Add New Salary</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/addIncetiveTarget">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GiftIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Incentive Targets</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/analyticsProgress">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChartBarIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Salary Analysis</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/salaryFinalization">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckBadgeIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Salary Finalization</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/salary-cycles">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DocumentChartBarIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Salary Cycles</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/salary-summary">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BanknotesIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Salary Summary</span>
              </div>
            )}
          </NavLink>

          {/* Reports Section Divider */}
          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</p>
          </div>

          <NavLink to="/accountant/monthlyReport">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DocumentChartBarIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Monthly Report</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/reconciliation">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClipboardDocumentCheckIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Reconciliation</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/accountant/revenueReport">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BanknotesIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm">Revenue Report</span>
              </div>
            )}
          </NavLink>

          {/* Add some bottom padding for scroll */}
          <div className="h-4"></div>
        </nav>

        {/* Profile - Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 my-1 mb-3">
            <div className="w-10 h-10 bg-[url('./assets/profileaccountant.png')] rounded-full bg-cover border-2 border-gray-200"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Athulya R Chandra</p>
              <p className="text-xs text-gray-500">accountant</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors duration-150"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 ml-64 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AccountantPortal;
