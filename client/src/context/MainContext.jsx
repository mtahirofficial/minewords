// src/context/MainContext.jsx
import { createContext, useState, useContext } from "react";

const MainContext = createContext();

export const MainProvider = ({ children }) => {

    const [loginModal, setLoginModal] = useState(false);
    const [verificationModal, setVerificationModal] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");

    return (
        <MainContext.Provider value={{ 
            loginModal, 
            setLoginModal,
            verificationModal,
            setVerificationModal,
            globalSearch,
            setGlobalSearch
        }}>
            {children}
        </MainContext.Provider>
    );
};

// Custom hook for easy access
export const useMain = () => useContext(MainContext);
