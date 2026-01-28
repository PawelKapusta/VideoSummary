import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
}

const TypewriterAnimation: React.FC<TypewriterAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = "",
  cursorClassName = "",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span data-testid="typewriter-animation" className={className}>
      {displayText}
      {!isComplete && (
        <motion.span
          className={`inline-block w-0.5 h-5 bg-current ml-0.5 ${cursorClassName}`}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </span>
  );
};

export default TypewriterAnimation;
