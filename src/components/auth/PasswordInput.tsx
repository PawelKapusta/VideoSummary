import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  showToggle?: boolean;
}

export function PasswordInput({ 
  value, 
  onChange, 
  onBlur, 
  error, 
  disabled,
  showToggle = true 
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password">
        Password <span className="text-red-500" aria-label="required">*</span>
      </Label>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={isVisible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={error ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'password-error' : undefined}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={toggleVisibility}
            disabled={disabled}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
      {error && (
        <p id="password-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

