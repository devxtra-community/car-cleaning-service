import { lazy, Suspense } from 'react';
import Loader from './WebPages/Loader';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

/* Public */
const MainSignIn = lazy(() => import('./WebPages/SignInContainer'));
const PrivacyPolicy = lazy(() => import('./WebPages/PrivacyPolicy'));

/* Portals */
const AdminPortal = lazy(() => import('./components/admin/AdminPortal'));
const AccountantPortal = lazy(() => import('./components/accountant/AccountantPortal'));

/* Admin pages */
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const Customers = lazy(() => import('./components/admin/Customers'));
const Cleaners = lazy(() => import('./components/admin/Cleaners'));
const VehicleManagement = lazy(() => import('./components/admin/Vehicle_Management'));
const BuildingsManagement = lazy(() => import('./components/admin/BuildingsManagement'));
const AddBuilding = lazy(() => import('./components/admin/AddBuilding'));
const Supervisors = lazy(() => import('./components/admin/Supervisors'));
const CleanerUnderSupervisorDetails = lazy(() => import('./components/admin/SupervisorDetails'));
const AddVehicles = lazy(() => import('./components/admin/AddVehicles'));
const RegisterUser = lazy(() => import('./components/admin/RegisterUser'));
const CleanerDetails = lazy(() => import('./components/admin/CleanerDetails'));
const TargetManagement = lazy(() => import('./components/admin/TargetManagement'));
const OperationalReports = lazy(() => import('./components/admin/OperationalReports'));
const PerformanceInsights = lazy(() => import('./components/admin/PerformanceInsights'));

/* Accountant pages */
const Accountant = lazy(() => import('./components/accountant/AccDashboard'));

/* Shared pages */
const SalaryFinalization = lazy(() => import('./components/shared/SalaryFinalization'));
const MonthlyReport = lazy(() => import('./components/shared/MonthlyReport'));
const Reconciliation = lazy(() => import('./components/shared/Reconciliation'));
const SalaryPerPerson = lazy(() => import('./components/shared/SalaryPerPerson'));
const IncentivesDashboard = lazy(() => import('./components/shared/IncentivesDashboard'));
const AddIncentiveTarget = lazy(() => import('./components/shared/IncentivesDashboard'));
const EditIncentiveTarget = lazy(() => import('./components/shared/AddEditTypeModal'));
const AnalyticsProgress = lazy(() => import('./components/shared/AnalyticsProgress'));
const SalaryCycle = lazy(() => import('./components/shared/SalaryCycles'));
const Review = lazy(() => import('./WebPages/Review'));

const SalaryList = lazy(() => import('./components/shared/SalaryList'));
const SalarySummary = lazy(() => import('./components/shared/SalarySummary'));
const BuildingDetailsPage = lazy(() => import('./components/admin/BuildingDetails'));
const EditBuilding = lazy(() => import('./components/admin/EditBuilding'));
const RoleBasedSalary = lazy(() => import('./components/shared/RoleBasedSalary'));

function AppRouter() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<MainSignIn />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/review/:taskId" element={<Review />} />

          {/* Accountant Portal */}
          <Route path="/accountant" element={<AccountantPortal />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Accountant />} />

            {/* Shared salary pages */}
            <Route path="salaryFinalization" element={<SalaryFinalization />} />
            <Route path="monthlyReport" element={<MonthlyReport />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="salaryDetails/:userId" element={<SalaryPerPerson />} />
            <Route path="incentives" element={<IncentivesDashboard />} />
            <Route path="role-salaries" element={<RoleBasedSalary />} />
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

            <Route path="supervisors" element={<Supervisors />} />
            <Route path="supervisor/:supervisorId" element={<CleanerUnderSupervisorDetails />} />
            <Route path="register/:role" element={<RegisterUser />} />
            <Route path="cleaner/:cleanerId" element={<CleanerDetails />} />
            <Route path="buildings/:buildingId" element={<BuildingDetailsPage />} />
            <Route path="buildings/:buildingId/edit" element={<EditBuilding />} />
            <Route path="targets" element={<TargetManagement />} />
            <Route path="operational-reports" element={<OperationalReports />} />
            {/* Shared salary pages for admin also */}
            <Route path="salaryFinalization" element={<SalaryFinalization />} />
            <Route path="monthlyReport" element={<MonthlyReport />} />
            <Route path="reconciliation" element={<Reconciliation />} />
            <Route path="salaryDetails/:userId" element={<SalaryPerPerson />} />
            <Route path="incentives" element={<IncentivesDashboard />} />
            <Route path="AnalyticsProgress" element={<AnalyticsProgress />} />
            <Route path="salary-cycles" element={<SalaryCycle />} />
            <Route path="salaries/:cycleId" element={<SalaryList />} />
            <Route path="reconciliation/:cycleId" element={<Reconciliation />} />
            <Route path="salary-summary" element={<SalarySummary />} />
            <Route path="incentives/add" element={<AddIncentiveTarget />} />
            <Route path="incentives/edit/:incentiveId" element={<EditIncentiveTarget />} />
            <Route path="insights" element={<PerformanceInsights />} />
            <Route path="role-salaries" element={<RoleBasedSalary />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default AppRouter;
