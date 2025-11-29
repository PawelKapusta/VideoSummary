import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface ConfirmPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  passwordValue: string;
}

export function ConfirmPasswordInput({ 
  value, 
  onChange, 
  onBlur, 
  error, 
  disabled,
  passwordValue 
}: ConfirmPasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="confirm-password">
        Confirm Password <span className="text-red-500" aria-label="required">*</span>
      </Label>
      <div className="relative">
        <Input
          id="confirm-password"
          name="confirm-password"
          type={isVisible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={error ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'confirm-password-error' : undefined}
        />
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
      </div>
      {error && (
        <p id="confirm-password-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
