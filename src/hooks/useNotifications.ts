import { useEffect, useCallback } from 'react';

export function useNotifications() {
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/app_icon_512.png',
                ...options,
            });
        }
    }, []);

    return { sendNotification };
}
