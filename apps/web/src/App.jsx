import { lazy, Suspense } from 'react';
import Loader from './pages/Loader';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

/* Public */
const Login = lazy(() => import('./pages/Login'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

/* Portals */
const AdminPortal = lazy(() => import('./components/admin/AdminPortal'));
const AccountantPortal = lazy(() => import('./components/accountant/AccountantPortal'));

/* Admin pages */
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const Customers = lazy(() => import('./components/admin/Customers'));
const Cleaners = lazy(() => import('./components/admin/Cleaners'));
const AddCleaners = lazy(() => import('./components/admin/AddCleaners'));
const VehicleManagement = lazy(() => import('./components/admin/Vehicle_Management'));
const BuildingsManagement = lazy(() => import('./components/admin/BuildingsManagement'));
const AddBuilding = lazy(() => import('./components/admin/AddBuilding'));

const Supervisors = lazy(() => import('./components/admin/Supervisors'));
const AddSupervisor = lazy(() => import('./components/admin/AddSupervisor'));
const CleanerUnderSupervisorDetails = lazy(() => import('./components/admin/SupervisorDetails'));
const AddVehicles = lazy(() => import('./components/admin/AddVehicles'));

/* Accountant pages */
const Accountant = lazy(() => import('./components/accountant/AccDashboard'));

/* Shared pages */
const AddNewSalary = lazy(() => import('./components/shared/AddNewSalary'));
const SalaryFinalization = lazy(() => import('./components/shared/SalaryFinalization'));
const MonthlyReport = lazy(() => import('./components/shared/MonthlyReport'));
const Reconciliation = lazy(() => import('./components/shared/Reconciliation'));
const SalaryPerPerson = lazy(() => import('./components/shared/SalaryPerPerson'));
const AddIncetiveTarget = lazy(() => import('./components/shared/AddIncentiveTarget'));
const AnalyticsProgress = lazy(() => import('./components/shared/AnalyticsProgress'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />

          {/* Accountant Portal */}
          <Route path="/accountant" element={<AccountantPortal />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Accountant />} />

            {/* Shared salary pages */}
            <Route path="addNewSalary" element={<AddNewSalary />} />
            <Route path="salaryFinalization" element={<SalaryFinalization />} />
            <Route path="monthlyReport" element={<MonthlyReport />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="salaryDetails/:userId" element={<SalaryPerPerson />} />
            <Route path="addIncetiveTarget" element={<AddIncetiveTarget />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<AdminPortal />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="customer" element={<Customers />} />

            <Route path="vechicles" element={<VehicleManagement />} />
            <Route path="vechicles/addVehicles" element={<AddVehicles />} />

            <Route path="buildings" element={<BuildingsManagement />} />
            <Route path="buildings/add" element={<AddBuilding />} />

            <Route path="cleaners" element={<Cleaners />} />
            <Route path="cleaners/addCleaners" element={<AddCleaners />} />

            <Route path="supervisors" element={<Supervisors />} />
            <Route path="supervisors/addSupervisor" element={<AddSupervisor />} />
            <Route path="supervisor/:supervisorId" element={<CleanerUnderSupervisorDetails />} />

            {/* Shared salary pages for admin also */}
            <Route path="addNewSalary" element={<AddNewSalary />} />
            <Route path="salaryFinalization" element={<SalaryFinalization />} />
            <Route path="monthlyReport" element={<MonthlyReport />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="salaryDetails/:userId" element={<SalaryPerPerson />} />
            <Route path="addIncetiveTarget" element={<AddIncetiveTarget />} />
            <Route path="AnalyticsProgress" element={<AnalyticsProgress />} />
          </Route>

          {/* Catch all */}
          {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
