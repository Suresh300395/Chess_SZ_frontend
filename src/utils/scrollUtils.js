/**
 * Smoothly scrolls to the top of the tab container,
 * accounting for fixed headers and responsive viewport heights.
 */
export const scrollToTabContainer = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    requestAnimationFrame(() => {
        setTimeout(() => {
            const tabSection = document.querySelector('.tab-content-section') || document.querySelector('.tab-content-card');
            if (tabSection) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.getBoundingClientRect().height : (window.innerWidth < 900 ? 55 : 70);
                const rect = tabSection.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetY = rect.top + scrollTop - headerHeight - (window.innerWidth < 900 ? 12 : 16);

                window.scrollTo({
                    top: Math.max(0, targetY),
                    behavior: 'smooth'
                });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }, 30);
    });
};

