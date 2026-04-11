import React from 'react'
import { useMain } from '../context/MainContext';

const LoginPopup = () => {
    const { loginModal, setLoginModal } = useMain()
    if (loginModal) {
        return (
            <div className="popup-overlay">
                <div className="popup-box">
                    <h3>You must login</h3>

                    <div className="popup-actions">
                        <button onClick={() => window.location.href = "/login"}>
                            Login
                        </button>

                        <button onClick={() => setLoginModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return null
}

export default LoginPopup
