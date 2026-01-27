import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, description, footer }) => {
  return (
    <div
      data-testid="auth-layout"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#fafafa] px-4 py-12"
    >
      {/* Background Animation Elements - Refined for Light Mode */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-100/50 blur-[120px]"
        />
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <Card className="relative bg-white/80 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[24px] border border-slate-200/60">
          <CardHeader className="space-y-4 pb-2 pt-8">
            <div className="flex justify-center mb-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20"
              >
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </motion.div>
            </div>
            <div className="space-y-1.5 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">{title}</CardTitle>
              <CardDescription className="text-slate-500 text-[15px]">{description}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-0 pt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="form-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {footer && (
            <CardFooter className="px-8 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-col">
              {footer}
            </CardFooter>
          )}
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} VideoSummary. Precise insights for everyone.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
