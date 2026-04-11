import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({
    isOpen,
    onClose,
    children,
    header,
    footerText,
    footerTextLink,
    primaryAction,
    secondaryAction,
    primaryActionType = "success", // "success" or "critical"
    showCloseButton = true,
    closeOnOverlayClick = true
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden"; // Prevent body scroll
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    const handlePrimaryClick = () => {
        if (primaryAction?.onClick) {
            primaryAction.onClick();
        }
        if (primaryAction?.closeOnClick !== false) {
            onClose();
        }
    };

    const handleSecondaryClick = () => {
        if (secondaryAction?.onClick) {
            secondaryAction.onClick();
        }
        if (secondaryAction?.closeOnClick !== false) {
            onClose();
        }
    };

    return (
        <div className="popup-overlay" onClick={handleOverlayClick}>
            <div className="modal-container">
                {/* Header */}
                {header && (
                    <div className="modal-header">
                        <h3>{header}</h3>
                        {showCloseButton && (
                            <button
                                className="modal-close-btn"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Close button when no header */}
                {!header && showCloseButton && (
                    <button
                        className="modal-close-btn modal-close-btn-top-right"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Content */}
                <div className="modal-content">
                    {children}
                </div>

                {/* Footer */}
                {(footerText || primaryAction || secondaryAction) && (
                    <div className="modal-footer">
                        {footerText && (
                            <div className="modal-footer-text">
                                {footerTextLink ? (
                                    <span>
                                        {footerText.split(footerTextLink.text)[0]}
                                        <a
                                            href={footerTextLink.href}
                                            onClick={footerTextLink.onClick}
                                            className="modal-footer-link"
                                        >
                                            {footerTextLink.text}
                                        </a>
                                        {footerText.split(footerTextLink.text)[1]}
                                    </span>
                                ) : (
                                    <span>{footerText}</span>
                                )}
                            </div>
                        )}
                        {(primaryAction || secondaryAction) && (
                            <div className="modal-actions">
                                {secondaryAction && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleSecondaryClick}
                                        disabled={secondaryAction.disabled}
                                    >
                                        {secondaryAction.label}
                                    </button>
                                )}
                                {primaryAction && (
                                    <button
                                        className={`btn ${primaryActionType === 'critical' ? 'btn-critical' : primaryActionType === 'success' ? 'btn-success' : 'btn-primary'}`}
                                        onClick={handlePrimaryClick}
                                        disabled={primaryAction.disabled}
                                    >
                                        {primaryAction.label}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;

