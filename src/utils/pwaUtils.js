/**
 * PWA Utility Helpers
 * Provides device detection, standalone mode checks, and platform info.
 */

export const isStandalone = () => {
    if (typeof window === 'undefined') return false;

    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
};

export const isIOS = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    return (isAppleDevice || isIPadOS) && !window.MSStream;
};

export const isSafari = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('android');
};

export const isAndroid = () => {
    if (typeof navigator === 'undefined') return false;
    return /android/i.test(navigator.userAgent);
};

export const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isOnline = () => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
};

export const getPlatformDetails = () => {
    const ios = isIOS();
    const android = isAndroid();
    const safari = isSafari();
    const standalone = isStandalone();
    const mobile = isMobile();

    let platform = 'desktop';
    if (ios) platform = 'ios';
    else if (android) platform = 'android';

    return {
        isIOS: ios,
        isSafari: safari,
        isAndroid: android,
        isStandalone: standalone,
        isMobile: mobile,
        platform
    };
};
