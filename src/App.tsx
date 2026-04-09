import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Collections from './pages/Collections';
import Lookbook from './pages/Lookbook';
import About from './pages/About';
import Contact from './pages/Contact';
import PaymentDelivery from './pages/PaymentDelivery';
<<<<<<< HEAD
import TrackOrder from './pages/TrackOrder';
import OrderConfirmed from './pages/OrderConfirmed';
import UploadPaymentProof from './pages/UploadPaymentProof';
=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';
<<<<<<< HEAD
import { isAdminSessionOpen } from './lib/adminAuth';
=======
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
<<<<<<< HEAD
  const { loading } = useAuth();
=======
  const { user, isAdmin, loading } = useAuth();
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

<<<<<<< HEAD
  if (!isAdminSessionOpen()) {
=======
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-black">
        <ScrollToTop />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/lookbook" element={<Lookbook />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/payment-delivery" element={<PaymentDelivery />} />
<<<<<<< HEAD
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/order-confirmed/:orderId" element={<OrderConfirmed />} />
            <Route path="/upload-payment-proof/:orderId" element={<UploadPaymentProof />} />
            <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
            <Route path="/admin/:section" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
=======
            <Route path="/admin" element={<Admin />} />
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> b5da4f6c8f87f3bd93256a9efd97c5d34ba209ee
