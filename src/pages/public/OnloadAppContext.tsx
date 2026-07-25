// contexts/AppContext.tsx (ya naya file banao)
import React, { createContext, useContext, useState } from 'react';

interface OnLoadData {
    permissions: any;
    pinNumber: number;
    hasCheckedInToday: boolean;
    compulsaryAttendance: boolean;
    companyFlag: number;
    expiryDays?: number;
    expiryMsg?: string;
    advertisement?: string;
    checkPlan: any;
    item: any;
    isLoading: boolean;
}

interface AppContextType {
    onLoadData: OnLoadData | null;
    refreshOnLoad: () => void;
    setOnLoadData: (data: OnLoadData) => void;
}

const OnloadAppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [onLoadData, setOnLoadDataInternal] = useState<OnLoadData | null>(null);

    const setOnLoadData = (data: OnLoadData) => {
        setOnLoadDataInternal(data);
    };

    const refreshOnLoad = () => {
        setOnLoadDataInternal(null); // Trigger refresh
    };

    return (
        <OnloadAppContext.Provider value={{ onLoadData, refreshOnLoad, setOnLoadData }}>
            {children}
        </OnloadAppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(OnloadAppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};