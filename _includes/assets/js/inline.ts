document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle') as HTMLInputElement | null;
    const container = document.getElementById('theme-toggle-container');

    if (!toggleBtn) return;

    // Initialize icon based on current theme
    const initTheme = document.documentElement.getAttribute('data-theme');
    if (initTheme === 'dark') {
        toggleBtn.checked = true;
    } else {
        toggleBtn.checked = false;
    }

    // Show the toggle once the initial state is set
    if (container) {
        container.style.visibility = 'visible';

        // Add transition class after a tiny delay to prevent initial animation
        setTimeout(() => {
            const switchEl = document.querySelector('.theme-switch');
            if (switchEl) switchEl.classList.add('has-transition');
        }, 50);
    }

    toggleBtn.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target) return;
        let targetTheme = target.checked ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('theme', targetTheme);
    });
});
