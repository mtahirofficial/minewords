import React from "react";
import { useRouter } from "next/router";
import { useMain } from "../context/MainContext";

const VerificationPopup = () => {
  const router = useRouter();
  const { verificationModal, setVerificationModal } = useMain();

  if (!verificationModal) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3>Email verification required</h3>
        <p className="popup-description">
          Verify your email to create posts, like, and comment. You can resend
          the link from your dashboard.
        </p>

        <div className="popup-actions">
          <button
            onClick={() => {
              setVerificationModal(false);
              router.push("/dashboard");
            }}
          >
            Go to Dashboard
          </button>

          <button onClick={() => setVerificationModal(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPopup;
