import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  showToggle?: boolean;
}

export const ConfirmPasswordInput: React.FC<ConfirmPasswordInputProps> = ({
  value,
  onChange,
  onBlur,
  label = "Confirm Password",
  error,
  disabled = false,
  showToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div data-testid="confirm-password-input" className="space-y-2">
      <Label
        htmlFor="confirm-password"
        className={`text-sm font-semibold ${error ? "text-red-500" : "text-slate-700"}`}
      >
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="confirm-password"
          type={showToggle && showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all duration-200 rounded-xl h-11 ${error ? "border-red-500 focus-visible:ring-red-500/20" : ""} ${showToggle ? "pr-10" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? "confirm-password-error" : undefined}
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
        <p id="confirm-password-error" className="text-sm text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
