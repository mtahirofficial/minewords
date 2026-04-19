import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileMenu from "./components/MobileMenu";
import LoginPopup from "./components/LoginPopup";
import VerificationPopup from "./components/VerificationPopup";
import ScrollToTop from "./components/ScrollToTop";
import Breadcrumb from "./components/Breadcrumb";

function App({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        {isMenuOpen && (
          <MobileMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
        )}
        <div className="breadcrumb-shell">
          <Breadcrumb />
        </div>
        {children}
        <LoginPopup />
        <VerificationPopup />
      </div>
      <Footer />
    </>
  );
}

export default App;
