import React from 'react';
import appLogo from '../../assets/appLogo.png';
import { Link, Outlet } from 'react-router-dom';

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
          <Link to="/admin/AddMemebers">
            <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <UserPlusIcon className="w-5 h-5" />
              Add Staff
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

          <Link to="/admin/customer">
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
          <div className="flex items-center gap-3 px-3 py-2 rounded bg-gray-100 font-medium">
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
