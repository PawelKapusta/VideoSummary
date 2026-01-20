import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  showStrength?: boolean;
  showToggle?: boolean;
}

const SPECIAL_CHARS = "!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?";

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  onBlur,
  label = "Password",
  error,
  disabled = false,
  showStrength = false,
  showToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (new RegExp(`[${SPECIAL_CHARS}]`).test(password)) score++;
    return score / 5; // 0 to 1
  };

  const strength = getStrength(value);
  const getStrengthColor = () => {
    if (strength < 0.4) return "bg-red-500";
    if (strength < 0.8) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password" className={`text-sm font-semibold ${error ? "text-red-500" : "text-slate-700"}`}>
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showToggle && showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all duration-200 rounded-xl h-11 ${error ? "border-red-500 focus-visible:ring-red-500/20" : ""} ${showToggle ? "pr-10" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className={`h-4 w-4 ${error ? "text-red-500" : "text-muted-foreground"}`} />
            ) : (
              <Eye className={`h-4 w-4 ${error ? "text-red-500" : "text-muted-foreground"}`} />
            )}
          </Button>
        )}
      </div>
      {error && (
        <p id="password-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Password strength</span>
            <span>{Math.round(strength * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
              style={{ width: `${strength * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className={value.length >= 8 ? "text-foreground" : "text-muted-foreground"}>
              • At least 8 characters
            </span>
            <span className={/[a-z]/.test(value) ? "text-foreground" : "text-muted-foreground"}>
              • One lowercase letter
            </span>
            <span className={/[A-Z]/.test(value) ? "text-foreground" : "text-muted-foreground"}>
              • One uppercase letter
            </span>
            <span className={/\d/.test(value) ? "text-foreground" : "text-muted-foreground"}>• One number</span>
            <span
              className={new RegExp(`[${SPECIAL_CHARS}]`).test(value) ? "text-foreground" : "text-muted-foreground"}
            >
              • One special character
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
