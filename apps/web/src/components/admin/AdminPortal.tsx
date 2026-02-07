import React, { useEffect } from 'react';
import appLogo from '../../assets/appLogo.png';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
  HomeIcon,
  UserPlusIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
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
          <Link to="/admin/dashboard">
            <div className="flex items-center gap-3 px-3 py-2 rounded bg-gray-100 font-medium">
              <HomeIcon className="w-5 h-5" />
              Dashboard
            </div>
          </Link>
          <Link to="/admin/cleaners">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <UserPlusIcon className="w-5 h-5" />
              Cleaner
            </div>
          </Link>

          <Link to="/admin/vechicles">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <CurrencyRupeeIcon className="w-5 h-5" />
              Vehicle Management
            </div>
          </Link>

          <Link to="/admin/supervisors">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <DocumentTextIcon className="w-5 h-5" />
              Supervisor
            </div>
          </Link>

          <Link to="/admin/buildings">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <DocumentTextIcon className="w-5 h-5" />
              Buildings
            </div>
          </Link>

          <Link to="/admin/floors">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <DocumentTextIcon className="w-5 h-5" />
              Floors
            </div>
          </Link>

          <Link to="/admin/register-user">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <ClockIcon className="w-5 h-5" />
              Customers
            </div>
          </Link>

          <Link to="/admin/reconciliation">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              Revenue
            </div>
          </Link>
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
