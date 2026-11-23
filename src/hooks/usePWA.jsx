import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { isStandalone, isOnline as checkIsOnline, getPlatformDetails } from '../utils/pwaUtils';

const PWAContext = createContext(null);

export const PWAProvider = ({ children }) => {
    const [canInstall, setCanInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(() => isStandalone());
    const [isOnline, setIsOnline] = useState(() => checkIsOnline());
    const [showBackOnlinePill, setShowBackOnlinePill] = useState(false);
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);

    const updateSWFnRef = useRef(null);

    // Initialize Service Worker with virtual:pwa-register
    useEffect(() => {
        try {
            const updateSW = registerSW({
                immediate: true,
                onNeedRefresh() {
                    setNeedRefresh(true);
                },
                onOfflineReady() {
                    setOfflineReady(true);
                },
                onRegistered(registration) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log('[PWA] Service Worker registered', registration);
                    }
                },
                onRegisterError(error) {
                    console.warn('[PWA] Service Worker registration failed', error);
                }
            });
            updateSWFnRef.current = updateSW;
        } catch (err) {
            console.warn('[PWA] Service Worker registration skipped or failed:', err);
        }
    }, []);

    // Intercept native beforeinstallprompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setCanInstall(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setCanInstall(false);
            setIsInstalled(true);
            setShowInstallModal(false);
        };

        // Listen for display-mode changes (e.g. user opened as standalone PWA)
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e) => {
            if (e.matches) {
                setIsInstalled(true);
                setCanInstall(false);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleDisplayModeChange);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleDisplayModeChange);
            }
        };
    }, []);

    // Listen for online / offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnlinePill(true);
            const timer = setTimeout(() => {
                setShowBackOnlinePill(false);
            }, 3500);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnlinePill(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Trigger installation
    const installApp = useCallback(async () => {
        const platform = getPlatformDetails();

        // iOS devices do not support beforeinstallprompt; show guide modal
        if (platform.isIOS) {
            setShowInstallModal(true);
            return { outcome: 'instructions_shown' };
        }

        // Native prompt available
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult && choiceResult.outcome === 'accepted') {
                    setCanInstall(false);
                    setDeferredPrompt(null);
                }
                return choiceResult;
            } catch (err) {
                console.error('[PWA] Native prompt error', err);
                setShowInstallModal(true);
                return { outcome: 'error', error: err };
            }
        }

        // Fallback: Show manual install guidance modal
        setShowInstallModal(true);
        return { outcome: 'fallback_modal_shown' };
    }, [deferredPrompt]);

    // Update Service Worker to activate new version
    const updateApp = useCallback(async () => {
        if (updateSWFnRef.current) {
            await updateSWFnRef.current(true);
        } else {
            window.location.reload();
        }
    }, []);

    const dismissUpdate = useCallback(() => {
        setNeedRefresh(false);
    }, []);

    const contextValue = {
        canInstall,
        isInstalled,
        isOnline,
        showBackOnlinePill,
        needRefresh,
        offlineReady,
        showInstallModal,
        setShowInstallModal,
        installApp,
        updateApp,
        dismissUpdate,
        platform: getPlatformDetails()
    };

    return (
        <PWAContext.Provider value={contextValue}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (!context) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};

export default usePWA;
