import { lazy, Suspense } from 'react';
import Loader from './pages/Loader';
import { Routes, Route } from 'react-router-dom';
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
const CleanerUnderSupervisorDetails = lazy(
  () => import('./components/admin/CleanerUnder_Supervisor_Details')
);
const AddVehicles = lazy(() => import('./components/admin/AddVehicles'));

/* Accountant pages */
const Accountant = lazy(() => import('./components/accountant/AccDashboard'));
const AddNewSalary = lazy(() => import('./components/accountant/AddNewSalary'));
const SalaryFinalization = lazy(() => import('./components/accountant/SalaryFinalization'));
const MonthlyReport = lazy(() => import('./components/accountant/MonthlyReport'));
const Reconciliation = lazy(() => import('./components/accountant/Reconciliation'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/Login" element={<Login />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />

          <Route path="/accountant" element={<AccountantPortal />}>
            <Route path="dashboard" element={<Accountant />} />
            <Route path="addNewSalary" element={<AddNewSalary />} />
            <Route path="salaryFinalization" element={<SalaryFinalization />} />
            <Route path="monthlyReport" element={<MonthlyReport />} />
            <Route path="reconciliation" element={<Reconciliation />} />
          </Route>

          <Route path="/admin" element={<AdminPortal />}>
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
            <Route path="supervisors/:supervisorId/cleaners" element={<CleanerUnderSupervisorDetails />} />
            <Route path="vechicles" element={<VehicleManagement />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
