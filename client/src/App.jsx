import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import BlogListPage from "./pages/BlogListPage";
import SingleBlogPage from "./pages/SingleBlogPage";
import BlogForm from "./pages/BlogForm";
import './App.css'
import Footer from './components/Footer';
import MobileMenu from './components/MobileMenu';
import CategoriesPage from './pages/CategoriesPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPopup from './components/LoginPopup';
import VerificationPopup from './components/VerificationPopup';
import NotFoundPage from './pages/NotFoundPage';
import ScrollToTop from './components/ScrollToTop';
import Profile from './pages/Profile';
import HashtagPage from './pages/HashtagPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        {isMenuOpen && <MobileMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />}
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            {/* <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> */}
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:slug" element={<CategoriesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            {/* <Route path="/blogs" element={<BlogListPage />} /> */}
            <Route path="/blog/:slug" element={<SingleBlogPage />} />
            <Route path="/hashtag/:tag" element={<HashtagPage />} />
            <Route path="/blog/:slug/edit" element={<ProtectedRoute><BlogForm /></ProtectedRoute>} />
            <Route path="/create" element={<BlogForm />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            {/* 404 Page Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
        <LoginPopup />
        <VerificationPopup />
      </div>
      <Footer />
    </Router>
  )
}

export default App
