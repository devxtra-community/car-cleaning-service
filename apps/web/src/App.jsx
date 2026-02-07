import { lazy, Suspense } from 'react';
import Loader from './pages/Loader';
import { Routes, Route } from 'react-router-dom';

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
const FloorsManagement = lazy(() => import('./components/admin/FloorsManagement'));
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

import { api, setAccessToken } from './services/commonAPI';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Attempt silent refresh on app load to restore session
    const restoreSession = async () => {
      try {
        console.log('App: Starting session restore...');
        const { data } = await api.post('/api/auth/refresh');
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          console.log('App: Session restored');
        }
      } catch (error) {
        // Normal if user is not logged in or session expired
        console.log('App: No active session found on load (or error)', error);
      } finally {
        console.log('App: Finished auth check, updating state...');
        setIsAuthChecking(false);
      }
    };
    restoreSession();
  }, []);

  if (isAuthChecking) {
    return <Loader />;
  }

  return (
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
          <Route path="floors" element={<FloorsManagement />} />
          <Route path="cleaners" element={<Cleaners />} />
          <Route path="cleaners/addCleaners" element={<AddCleaners />} />
          <Route path="supervisors" element={<Supervisors />} />
          <Route path="supervisors/addSupervisor" element={<AddSupervisor />} />
          <Route path="supervisors/cleaner" element={<CleanerUnderSupervisorDetails />} />
          <Route path="vechicles" element={<VehicleManagement />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
