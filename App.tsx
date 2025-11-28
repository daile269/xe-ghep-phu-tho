
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { PhoneCollectionModal } from './components/PhoneCollectionModal';
import { LoadingScreen } from './components/LoadingScreen';
import { Home } from './pages/Home';
import { FindRide } from './pages/FindRide';
import { PostRide } from './pages/PostRide';
import { BookRide } from './pages/BookRide';
import { RideDetails } from './pages/RideDetails';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { FindPassengers } from './pages/FindPassengers';
import { DriverHub } from './pages/DriverHub';
import { DriverRegistration } from './pages/DriverRegistration';
import { Wallet } from './pages/Wallet';
import { ReferPassenger } from './pages/ReferPassenger';
import { AdminDashboard } from './pages/AdminDashboard';

const AppContent: React.FC = () => {
  const { isAppReady } = useApp();

  if (!isAppReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <PhoneCollectionModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/find" element={<Layout><FindRide /></Layout>} />
        <Route path="/driver" element={<Layout><DriverHub /></Layout>} />
        <Route path="/driver-register" element={<Layout><DriverRegistration /></Layout>} />
        <Route path="/find-passengers" element={<Layout><FindPassengers /></Layout>} />
        <Route path="/refer-passenger" element={<Layout><ReferPassenger /></Layout>} />
        <Route path="/wallet" element={<Layout><Wallet /></Layout>} />
        <Route path="/post" element={<Layout><PostRide /></Layout>} />
        <Route path="/book-ride" element={<Layout><BookRide /></Layout>} />
        <Route path="/ride/:id" element={<Layout><RideDetails /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
