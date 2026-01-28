import React from "react";
import { motion } from "framer-motion";

interface BouncingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "purple" | "green" | "rainbow";
  className?: string;
}

const BouncingDots: React.FC<BouncingDotsProps> = ({ size = "md", color = "blue", className = "" }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const colors = {
    blue: [
      "bg-gradient-to-br from-blue-400 to-blue-600",
      "bg-gradient-to-br from-blue-500 to-blue-700",
      "bg-gradient-to-br from-blue-600 to-blue-800",
    ],
    purple: [
      "bg-gradient-to-br from-purple-400 to-purple-600",
      "bg-gradient-to-br from-purple-500 to-purple-700",
      "bg-gradient-to-br from-purple-600 to-purple-800",
    ],
    green: [
      "bg-gradient-to-br from-green-400 to-green-600",
      "bg-gradient-to-br from-green-500 to-green-700",
      "bg-gradient-to-br from-green-600 to-green-800",
    ],
    rainbow: [
      "bg-gradient-to-br from-red-400 to-red-600",
      "bg-gradient-to-br from-blue-400 to-blue-600",
      "bg-gradient-to-br from-green-400 to-green-600",
    ],
  };

  const currentSize = sizeClasses[size];
  const currentColors = colors[color];

  return (
    <div data-testid="bouncing-dots" className={`flex items-center justify-center space-x-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${currentSize} ${currentColors[index]} rounded-full shadow-lg relative`}
          animate={{
            y: [0, -12, 0],
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 ${currentColors[index]} rounded-full blur-sm opacity-60`}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />

          {/* Inner highlight */}
          <div className="absolute inset-0 bg-white/30 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
};

export default BouncingDots;
