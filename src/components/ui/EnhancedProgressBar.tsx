import React, { useEffect, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

interface EnhancedProgressBarProps {
  progress?: number; // 0-100, if not provided shows indeterminate animation
  className?: string;
  height?: string;
  showPercentage?: boolean;
  color?: "blue" | "green" | "purple" | "red" | "orange";
  variant?: "default" | "glow" | "striped" | "shimmer";
  duration?: number; // animation duration in seconds
}

const EnhancedProgressBar: React.FC<EnhancedProgressBarProps> = ({
  progress,
  className = "",
  height = "h-2",
  showPercentage = false,
  color = "blue",
  variant = "default",
  duration = 2,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(progress || 0);
  const controls = useAnimation();

  // Color configurations
  const colorConfigs = {
    blue: {
      bg: "bg-blue-100",
      fill: "bg-gradient-to-r from-blue-400 to-blue-600",
      glow: "shadow-blue-400/50",
      shimmer: "from-blue-300/50 to-blue-500/50",
    },
    green: {
      bg: "bg-green-100",
      fill: "bg-gradient-to-r from-green-400 to-green-600",
      glow: "shadow-green-400/50",
      shimmer: "from-green-300/50 to-green-500/50",
    },
    purple: {
      bg: "bg-purple-100",
      fill: "bg-gradient-to-r from-purple-400 to-purple-600",
      glow: "shadow-purple-400/50",
      shimmer: "from-purple-300/50 to-purple-500/50",
    },
    red: {
      bg: "bg-red-100",
      fill: "bg-gradient-to-r from-red-400 to-red-600",
      glow: "shadow-red-400/50",
      shimmer: "from-red-300/50 to-red-500/50",
    },
    orange: {
      bg: "bg-orange-100",
      fill: "bg-gradient-to-r from-orange-400 to-orange-600",
      glow: "shadow-orange-400/50",
      shimmer: "from-orange-300/50 to-orange-500/50",
    },
  };

  const currentColor = colorConfigs[color];

  useEffect(() => {
    if (progress !== undefined) {
      // Simulate realistic processing progress with variable speeds
      const simulateProgress = async () => {
        setAnimatedProgress(0);

        // Phase 1: Fast initial progress (0-20%)
        await controls.start({
          width: "20%",
          transition: { duration: 0.8, ease: "easeOut" },
        });
        setAnimatedProgress(20);

        // Phase 2: Slower middle progress (20-50%)
        await controls.start({
          width: "50%",
          transition: { duration: 1.5, ease: "easeInOut" },
        });
        setAnimatedProgress(50);

        // Phase 3: Variable final progress (50-target%)
        await controls.start({
          width: `${progress}%`,
          transition: { duration: duration * 0.7, ease: "easeInOut" },
        });
        setAnimatedProgress(progress);

        // Add subtle pulsing at the end
        while (true) {
          await controls.start({
            scaleX: 1.02,
            transition: { duration: 0.8, ease: "easeInOut" },
          });
          await controls.start({
            scaleX: 1,
            transition: { duration: 0.8, ease: "easeInOut" },
          });
        }
      };

      simulateProgress();
    } else {
      // Enhanced indeterminate animation with more dynamic movement
      const animate = async () => {
        while (true) {
          await controls.start({
            width: "25%",
            transition: { duration: 0.8, ease: "easeOut" },
          });
          await controls.start({
            width: "60%",
            transition: { duration: 1.2, ease: "easeInOut" },
          });
          await controls.start({
            width: "85%",
            transition: { duration: 0.6, ease: "easeIn" },
          });
          await controls.start({
            width: "95%",
            transition: { duration: 0.4, ease: "easeOut" },
          });
          await controls.start({
            width: "0%",
            transition: { duration: 0, ease: "easeInOut" },
          });
        }
      };
      animate();
    }
  }, [progress, controls, duration]);

  const renderProgressBar = () => {
    switch (variant) {
      case "glow":
        return (
          <div className={`relative ${height} ${currentColor.bg} rounded-full overflow-hidden ${className}`}>
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full shadow-lg ${currentColor.glow}`}
              animate={controls}
              initial={{ width: "0%" }}
              style={{
                background:
                  animatedProgress < 30
                    ? `linear-gradient(90deg, ${color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : color === "purple" ? "#8b5cf6" : color === "red" ? "#ef4444" : "#f59e0b"} 0%, ${color === "blue" ? "#60a5fa" : color === "green" ? "#34d399" : color === "purple" ? "#a78bfa" : color === "red" ? "#f87171" : "#fbbf24"} 100%)`
                    : animatedProgress < 70
                      ? `linear-gradient(90deg, ${color === "blue" ? "#2563eb" : color === "green" ? "#059669" : color === "purple" ? "#7c3aed" : color === "red" ? "#dc2626" : "#d97706"} 0%, ${color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : color === "purple" ? "#8b5cf6" : color === "red" ? "#ef4444" : "#f59e0b"} 100%)`
                      : `linear-gradient(90deg, ${color === "blue" ? "#1d4ed8" : color === "green" ? "#047857" : color === "purple" ? "#6d28d9" : color === "red" ? "#b91c1c" : "#b45309"} 0%, ${color === "blue" ? "#2563eb" : color === "green" ? "#059669" : color === "purple" ? "#7c3aed" : color === "red" ? "#dc2626" : "#d97706"} 100%)`,
              }}
            >
              {/* Enhanced glow effect */}
              <motion.div
                className={`absolute inset-0 blur-sm opacity-60`}
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background:
                    animatedProgress < 30
                      ? `linear-gradient(90deg, ${color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : color === "purple" ? "#8b5cf6" : color === "red" ? "#ef4444" : "#f59e0b"} 0%, ${color === "blue" ? "#60a5fa" : color === "green" ? "#34d399" : color === "purple" ? "#a78bfa" : color === "red" ? "#f87171" : "#fbbf24"} 100%)`
                      : animatedProgress < 70
                        ? `linear-gradient(90deg, ${color === "blue" ? "#2563eb" : color === "green" ? "#059669" : color === "purple" ? "#7c3aed" : color === "red" ? "#dc2626" : "#d97706"} 0%, ${color === "blue" ? "#3b82f6" : color === "green" ? "#10b981" : color === "purple" ? "#8b5cf6" : color === "red" ? "#ef4444" : "#f59e0b"} 100%)`
                        : `linear-gradient(90deg, ${color === "blue" ? "#1d4ed8" : color === "green" ? "#047857" : color === "purple" ? "#6d28d9" : color === "red" ? "#b91c1c" : "#b45309"} 0%, ${color === "blue" ? "#2563eb" : color === "green" ? "#059669" : color === "purple" ? "#7c3aed" : color === "red" ? "#dc2626" : "#d97706"} 100%)`,
                }}
              />
              {/* Inner highlight */}
              <div className="absolute inset-y-0 left-0 w-full bg-white/30 rounded-full" />
              {/* Animated particles */}
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-white/80 rounded-full"
                animate={{
                  left: ["0%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        );

      case "striped":
        return (
          <div className={`relative ${height} ${currentColor.bg} rounded-full overflow-hidden ${className}`}>
            <motion.div
              className={`absolute inset-y-0 left-0 ${currentColor.fill} rounded-full shadow-md`}
              animate={controls}
              initial={{ width: "0%" }}
            >
              {/* Animated stripes */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  backgroundSize: "20px 100%",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "20px 0%"],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>
        );

      case "shimmer":
        return (
          <div className={`relative ${height} ${currentColor.bg} rounded-full overflow-hidden ${className}`}>
            <motion.div
              className={`absolute inset-y-0 left-0 ${currentColor.fill} rounded-full`}
              animate={controls}
              initial={{ width: "0%" }}
            >
              {/* Shimmer effect */}
              <motion.div
                className={`absolute inset-y-0 left-0 w-8 bg-gradient-to-r ${currentColor.shimmer} rounded-full`}
                animate={{
                  x: ["0%", "400%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        );

      default: // 'default'
        return (
          <div className={`relative ${height} ${currentColor.bg} rounded-full overflow-hidden ${className}`}>
            <motion.div
              className={`absolute inset-y-0 left-0 ${currentColor.fill} rounded-full shadow-sm`}
              animate={controls}
              initial={{ width: "0%" }}
            >
              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {renderProgressBar()}
        <AnimatePresence>
          {progress !== undefined && variant === "glow" && (
            <motion.div
              className="absolute -top-1 left-0 w-2 h-2 bg-white rounded-full shadow-lg"
              style={{
                left: `calc(${animatedProgress}% - 4px)`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`absolute inset-0 bg-white rounded-full animate-ping ${currentColor.glow}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showPercentage && progress !== undefined && (
        <motion.div
          className="text-center text-sm font-medium text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(animatedProgress)}%
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedProgressBar;
