import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}

export function EmailInput({ value, onChange, onBlur, error, disabled }: EmailInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">
        Email <span className="text-red-500" aria-label="required">*</span>
      </Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error && (
        <p id="email-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

