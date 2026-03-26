import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
  GiftIcon,
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const AdminPortal = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('AdminPortal: Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Helper: compute active nav class based on path prefix(es)
  const navClass = (prefixes: string | string[]) => {
    const prefixArray = Array.isArray(prefixes) ? prefixes : [prefixes];
    const isActive = prefixArray.some(
      (prefix) => location.pathname === prefix || location.pathname.startsWith(prefix + '/')
    );
    return `flex items-center gap-3 my-1 px-3 py-2.5 rounded-lg transition-all duration-150 ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
      }`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen app-page-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white shadow-sm flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img width={32} height={32} src="/appLogo.png" alt="appLogo" className="rounded" />
            <p className="font-semibold text-gray-900">Car Cleaning</p>
          </div>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <Link to="/admin/dashboard">
            <div className={navClass('/admin/dashboard')}>
              <HomeIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Dashboard</span>
            </div>
          </Link>

          {/* Supervisors — also matches /admin/supervisor/:id */}
          <Link to="/admin/supervisors">
            <div className={navClass(['/admin/supervisors', '/admin/supervisor'])}>
              <UserIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Supervisors</span>
            </div>
          </Link>

          <Link to="/admin/targets">
            <div className={navClass(['/admin/targets'])}>
              <ClipboardDocumentCheckIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Target Management</span>
            </div>
          </Link>

          <Link to="/admin/operational-reports">
            <div className={navClass(['/admin/operational-reports'])}>
              <ChartBarIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Operational Reports</span>
            </div>
          </Link>

          {/* Cleaners — also matches /admin/cleaner/:id */}
          <Link to="/admin/cleaners">
            <div className={navClass(['/admin/cleaners', '/admin/cleaner'])}>
              <SparklesIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Cleaners</span>
            </div>
          </Link>

          <Link to="/admin/admins">
            <div className={navClass(['/admin/admins', '/admin/admin'])}>
              <ShieldCheckIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Admins</span>
            </div>
          </Link>

          <Link to="/admin/accountants">
            <div className={navClass(['/admin/accountants', '/admin/accountant'])}>
              <CurrencyDollarIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Accountants</span>
            </div>
          </Link>

          {/* Buildings — also matches /admin/buildings/:id and /admin/buildings/add */}
          <Link to="/admin/buildings">
            <div className={navClass(['/admin/buildings'])}>
              <BuildingOffice2Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Buildings</span>
            </div>
          </Link>

          <Link to="/admin/vechicles">
            <div className={navClass(['/admin/vechicles', '/admin/vehicles'])}>
              <TruckIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Vehicle Management</span>
            </div>
          </Link>

          {/* Salary Section */}
          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Salary Management
            </p>
          </div>

          <Link to="/admin/incentives">
            <div className={navClass('/admin/incentives')}>
              <GiftIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Incentive Targets</span>
            </div>
          </Link>

          <Link to="/admin/analyticsProgress">
            <div className={navClass('/admin/analyticsProgress')}>
              <ChartBarIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Salary Analysis</span>
            </div>
          </Link>

          <Link to="/admin/salaryFinalization">
            <div className={navClass('/admin/salaryFinalization')}>
              <CheckBadgeIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Salary Finalization</span>
            </div>
          </Link>

          <Link to="/admin/salary-cycles">
            <div className={navClass('/admin/salary-cycles')}>
              <DocumentChartBarIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Salary Cycles</span>
            </div>
          </Link>

          <Link to="/admin/salary-summary">
            <div className={navClass('/admin/salary-summary')}>
              <BanknotesIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Salary Summary</span>
            </div>
          </Link>

          <Link to="/admin/role-salaries">
            <div className={navClass('/admin/role-salaries')}>
              <UserGroupIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Role-Based Salary</span>
            </div>
          </Link>

          {/* Reports Section */}
          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</p>
          </div>

          <Link to="/admin/monthlyReport">
            <div className={navClass('/admin/monthlyReport')}>
              <DocumentChartBarIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Monthly Report</span>
            </div>
          </Link>

          <Link to="/admin/reconciliation">
            <div className={navClass('/admin/reconciliation')}>
              <ClipboardDocumentCheckIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Reconciliation</span>
            </div>
          </Link>

          <Link to="/admin/revenueReport">
            <div className={navClass('/admin/revenueReport')}>
              <BanknotesIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Revenue Report</span>
            </div>
          </Link>

          <Link to="/admin/insights">
            <div className={navClass('/admin/insights')}>
              <TrophyIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm">Performance Insights</span>
            </div>
          </Link>

          <div className="h-4"></div>
        </nav>

        {/* Profile — Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 my-1 mb-3">
            <div className="w-10 h-10 bg-[url('./assets/profileAdmin.png')] rounded-full bg-cover border-2 border-gray-200"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Athulya R Chandra</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2 px-1">
              Select Language
            </label>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="en">English (US)</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
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
      <main className="flex-1 p-6 ml-64 app-page-bg min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPortal;
