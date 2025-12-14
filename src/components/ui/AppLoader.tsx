import React from 'react';

interface AppLoaderProps {
    loadingText?: string;
    className?: string;
}

const AppLoader: React.FC<AppLoaderProps> = ({ loadingText = "Loading...", className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center w-full ${className || "min-h-[60vh]"}`}>
            <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-center text-slate-600 mt-4 font-medium">{loadingText}</p>
        </div>
    );
};

export default AppLoader;
