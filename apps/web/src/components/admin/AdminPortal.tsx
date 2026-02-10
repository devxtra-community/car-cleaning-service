import React, { useEffect } from 'react';
import appLogo from '../../assets/appLogo.png';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  TruckIcon,
  SparklesIcon,
  UserIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const AdminPortal = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('AdminPortal: Not authenticated, redirecting to login');
      navigate('/Login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/Login');
  };

  // Show nothing while loading to prevent flicker
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen ">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r flex flex-col">
        {/* Logo */}
        <div className="px-6 py-4 font-semibold text-lg border-b flex">
          <img width={30} height={20} src={appLogo} alt="appLogo" /> <p>Car Cleaning</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <NavLink to="/admin/dashboard">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded font-medium my-1 ${
                  isActive ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                Dashboard
              </div>
            )}
          </NavLink>

          <NavLink to="/admin/cleaners">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <SparklesIcon className="w-5 h-5" />
                Cleaner
              </div>
            )}
          </NavLink>

          <NavLink to="/admin/vechicles">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <TruckIcon className="w-5 h-5" />
                Vehicle Management
              </div>
            )}
          </NavLink>

          <NavLink to="/admin/supervisors">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Supervisor
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/analyticsProgress">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Salary analysis
              </div>
            )}
          </NavLink>

          <NavLink to="/admin/buildings">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <BuildingOffice2Icon className="w-5 h-5" />
                Buildings
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/addNewSalary">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <CurrencyRupeeIcon className="w-5 h-5" />
                Add new Salary
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/addIncetiveTarget">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <CurrencyRupeeIcon className="w-5 h-5" />
                Add Incentive Targets
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/salaryFinalization">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <CheckBadgeIcon className="w-5 h-5" />
                Salary Finalization
              </div>
            )}
          </NavLink>

          <NavLink to="/admin/monthlyReport">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <DocumentChartBarIcon className="w-5 h-5" />
                Monthly Report
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/reconciliation">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                Reconciliation
              </div>
            )}
          </NavLink>
          <NavLink to="/admin/revenueReport">
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded  my-1 ${
                  isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                <BanknotesIcon className="w-5 h-5" />
                Revenue Report
              </div>
            )}
          </NavLink>
        </nav>

        {/* Profile */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 text-gray-400 bg-[url('./assets/profileAdmin.png')] rounded-full bg-cover"></div>
            <div>
              <p className="text-sm font-medium">Athulya R Chandra</p>
              <p className="text-xs text-gray-500">admin</p>
            </div>
          </div>

          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded bg-gray-100 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Log out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPortal;
