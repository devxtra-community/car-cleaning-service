import { Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  return (
    <>
      <Routes>
        <Route path={'/login'} element={<Login />} />
        <Route path={'/privacyPolicy'} element={<PrivacyPolicy />} />
      </Routes>
    </>
  );
}

export default App;
