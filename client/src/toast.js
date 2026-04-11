export function showToast(message, type = "success") {
    // info,error,success
    // Remove existing toast if any
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    // Create toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    document.body.appendChild(toast);

    // Force reflow (for animation)
    setTimeout(() => {
        toast.classList.add("toast-show");
    }, 10);

    // Auto-hide
    setTimeout(() => {
        toast.classList.remove("toast-show");
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}
