import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

export function usePresence(location: string) {
    const user = useAuthStore(s => s.user);
    const socketRef = useRef<any>(null);
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        if (!user) return;

        const socket = io(API_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        const updatePresence = () => {
            socket.emit('presence_update', {
                username: user.username,
                role: user.role,
                location
            });
        };

        socket.on('connect', updatePresence);
        
        // Heartbeat every 30s
        const interval = setInterval(updatePresence, 30000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [user, location, API_URL]);

    const logAction = (action: string, details: string) => {
        if (socketRef.current && user) {
            socketRef.current.emit('log_action', {
                action,
                details,
                user: user.username,
                role: user.role
            });
        }
    };

    return { logAction };
}
