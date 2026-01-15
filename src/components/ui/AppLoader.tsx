import React from 'react';
import BouncingDots from './BouncingDots';

interface AppLoaderProps {
    loadingText?: string;
    className?: string;
}

const AppLoader: React.FC<AppLoaderProps> = ({ loadingText = "Loading...", className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center w-full ${className || "min-h-[60vh]"}`}>
            <BouncingDots size="md" color="blue" />
            <p className="text-center text-slate-600 mt-4 font-medium">{loadingText}</p>
        </div>
    );
};

export default AppLoader;
