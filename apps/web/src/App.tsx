import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from './pages/Loader';
import ProtectedRoute from './pages/ProtectedRoute';
import RoleProtectedRoute from './pages/RoleProtectedRoute';

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
const AddMemebers = lazy(() => import('./components/admin/AddMemebers'));
const Supervisors = lazy(() => import('./components/admin/Supervisors'));
const CleanerUnderSupervisorDetails = lazy(
  () => import('./components/admin/CleanerUnder_Supervisor_Details')
);
const AddVehicles = lazy(() => import('./components/admin/AddVehicles'));
const VehicleManagement = lazy(() => import('./components/admin/Vehicle_Management'));

/* Accountant pages */
const Accountant = lazy(() => import('./components/accountant/AccDashboard'));
const AddNewSalary = lazy(() => import('./components/accountant/AddNewSalary'));
const SalaryFinalization = lazy(() => import('./components/accountant/SalaryFinalization'));
const MonthlyReport = lazy(() => import('./components/accountant/MonthlyReport'));
const Reconciliation = lazy(() => import('./components/accountant/Reconciliation'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/privacyPolicy" element={<PrivacyPolicy />} />

        {/* AUTHENTICATED USERS ONLY */}
        <Route element={<ProtectedRoute />}>
          {/* ADMIN ROLE */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
            <Route path="/admin" element={<AdminPortal />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="customer" element={<Customers />} />
              <Route path="cleaners" element={<Cleaners />} />
              <Route path="AddMemebers" element={<AddMemebers />} />
              <Route path="supervisors" element={<Supervisors />} />
              <Route path="supervisors/cleaner" element={<CleanerUnderSupervisorDetails />} />
              <Route path="vechicles/addVehicles" element={<AddVehicles />} />
              <Route path="vechicles" element={<VehicleManagement />} />
            </Route>
          </Route>

          {/* ACCOUNTANT ROLE */}
          <Route element={<RoleProtectedRoute allowedRoles={['accountant']} />}>
            <Route path="/accountant" element={<AccountantPortal />}>
              <Route path="dashboard" element={<Accountant />} />
              <Route path="addNewSalary" element={<AddNewSalary />} />
              <Route path="salaryFinalization" element={<SalaryFinalization />} />
              <Route path="monthlyReport" element={<MonthlyReport />} />
              <Route path="reconciliation" element={<Reconciliation />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
