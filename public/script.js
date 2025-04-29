document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.style.display = 'none';
        setTimeout(() => {
            form.style.display = 'block';
        }, 1000); // Delay to evade basic crawlers
    }
});