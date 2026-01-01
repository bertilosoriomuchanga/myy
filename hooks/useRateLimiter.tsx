
import { useCallback } from 'react';

/**
 * A client-side rate limiter hook using localStorage.
 * This is not foolproof (clearing storage bypasses it) but serves as a good deterrent.
 * @param key A unique key for the action being rate-limited (e.g., 'login').
 * @param limit The maximum number of attempts allowed.
 * @param windowMs The time window in milliseconds.
 */
const useRateLimiter = (key: string, limit: number, windowMs: number) => {
    const storageKey = `mycese_rate_limit_${key}`;

    const getTimestamps = (): number[] => {
        try {
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : [];
        } catch {
            // If parsing fails, start fresh
            return [];
        }
    };

    /**
     * Checks if the rate limit has been exceeded.
     * It also cleans up old timestamps from storage.
     * @returns {boolean} True if the user is currently blocked.
     */
    const isBlocked = useCallback((): boolean => {
        const now = Date.now();
        const timestamps = getTimestamps();
        
        // Filter out attempts that are outside the current time window
        const recentTimestamps = timestamps.filter(ts => (now - ts) < windowMs);
        localStorage.setItem(storageKey, JSON.stringify(recentTimestamps));

        return recentTimestamps.length >= limit;
    }, [storageKey, windowMs, limit]);

    /**
     * Records a new attempt.
     */
    const recordAttempt = useCallback(() => {
        const now = Date.now();
        const timestamps = getTimestamps();
        
        const newTimestamps = [...timestamps, now];
        localStorage.setItem(storageKey, JSON.stringify(newTimestamps));
    }, [storageKey]);

    return { isBlocked, recordAttempt };
};

export default useRateLimiter;
