import { Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import PrivacyPolicy from './components/PrivacyPolicy';
import Accountant from './components/accountant/AccDashboard';
import AddNewSalary from './components/accountant/AddNewSalary';
import SalaryFinalization from './components/accountant/SalaryFinalization';
import MonthlyReport from './components/accountant/MonthlyReport';
import Reconciliation from './components/accountant/Reconciliation';
import AccountantPortal from './components/accountant/AccountantPortal';
import AdminPortal from './components/admin/AdminPortal';
import AdminDashboard from './components/admin/AdminDashboard';
import Customers from './components/admin/Customers';
import Cleaners from './components/admin/Cleaners';
import Supervisors from './components/admin/Supervisors';
import CleanerUnder_Supervisor_Details from './components/admin/CleanerUnder_Supervisor_Details';
import AddVehicles from './components/admin/AddVehicles';
import Vehicle_Management from './components/admin/Vehicle_Management';
import AddCleaners from './components/admin/AddCleaners';
import AddSupervisor from './components/admin/AddSupervisor';

function App() {
  return (
    <>
      <Routes>
        <Route path={'/login'} element={<Login />} />
        <Route path={'/privacyPolicy'} element={<PrivacyPolicy />} />
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
          <Route path="cleaners" element={<Cleaners />} />
          <Route path="cleaners/addCleaners" element={<AddCleaners />} />
          <Route path="supervisors" element={<Supervisors />} />
          <Route path="supervisors/addSupervisor" element={<AddSupervisor />} />
          <Route path="supervisors/cleaner" element={<CleanerUnder_Supervisor_Details />} />
          <Route path="vechicles/addVehicles" element={<AddVehicles />} />
          <Route path="vechicles" element={<Vehicle_Management />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
