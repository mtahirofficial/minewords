// Example usage of Modal component

import React, { useState } from "react";
import Modal from "./Modal";

const ModalExample = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                header="Modal Title"
                showCloseButton={true}
                closeOnOverlayClick={true}
                footerText="Need help? Contact us"
                footerTextLink={{
                    text: "Contact us",
                    href: "/contact",
                    onClick: (e) => {
                        e.preventDefault();
                        console.log("Link clicked");
                    }
                }}
                primaryAction={{
                    label: "Confirm",
                    type: "success",
                    onClick: () => {
                        console.log("Primary action clicked");
                    },
                    closeOnClick: true
                }}
                secondaryAction={{
                    label: "Cancel",
                    onClick: () => {
                        console.log("Secondary action clicked");
                    },
                    closeOnClick: true
                }}
                primaryActionType="success" // or "critical"
            >
                <p>This is the modal content. You can put anything here.</p>
            </Modal>

            {/* Example with critical action */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                header="Delete Item"
                primaryAction={{
                    label: "Delete",
                    onClick: () => console.log("Delete clicked")
                }}
                secondaryAction={{
                    label: "Cancel",
                    onClick: () => console.log("Cancel clicked")
                }}
                primaryActionType="critical"
            >
                <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            </Modal>

            {/* Example without header */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                showCloseButton={true}
            >
                <p>Modal without header</p>
            </Modal>

            {/* Example without footer */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                header="Simple Modal"
            >
                <p>Modal without footer actions</p>
            </Modal>
        </>
    );
};

export default ModalExample;

