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
      <Label htmlFor="email" className={`text-sm font-semibold ${error ? 'text-red-500' : 'text-slate-700'}`}>
        Email Address <span className="text-red-500" aria-label="required">*</span>
      </Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all duration-200 rounded-xl h-11 ${error ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
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

