import React, { createContext, useContext, useState, useCallback } from 'react';
import { getRandomMessage } from '../lib/motivationMessages';

const MotivationContext = createContext();

export const useMotivation = () => {
    const context = useContext(MotivationContext);
    if (!context) {
        throw new Error('useMotivation must be used within a MotivationProvider');
    }
    return context;
};

export const MotivationProvider = ({ children }) => {
    const [activeMotivation, setActiveMotivation] = useState(null);

    const showMotivation = useCallback((typeOrMessage) => {
        let message;
        if (typeof typeOrMessage === 'object' && typeOrMessage !== null) {
            message = typeOrMessage;
        } else {
            message = getRandomMessage(typeOrMessage);
        }

        // Force a reset if already showing to allow re-triggering animation
        setActiveMotivation(null);

        // Small timeout to allow React to process the reset
        setTimeout(() => {
            if (message) {
                setActiveMotivation({ ...message, id: Date.now() });
            }
        }, 50);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setActiveMotivation(null);
        }, 4050);
    }, []);

    const hideMotivation = useCallback(() => {
        setActiveMotivation(null);
    }, []);

    return (
        <MotivationContext.Provider value={{ activeMotivation, showMotivation, hideMotivation }}>
            {children}
        </MotivationContext.Provider>
    );
};
