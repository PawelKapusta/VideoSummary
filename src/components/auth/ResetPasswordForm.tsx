import type { FormEvent, ChangeEvent } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';
import type { ResetFormErrors } from '@/types';

interface Props {
  onSuccess?: () => void;
}

export default function ResetPasswordForm({ onSuccess }: Props) {
  const { formState, handleChange, handleSubmit } = useResetPasswordForm({ onSuccess });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const emailErrorId = 'email-error';
  const formErrorId = 'form-error';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className={formState.errors.email ? 'text-red-500' : ''}>
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formState.data.email}
          onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
          disabled={formState.isSubmitting || formState.isRateLimited}
          className={(formState.errors.email || formState.isRateLimited) ? 'border-red-500' : ''}
          aria-invalid={!!formState.errors.email || formState.isRateLimited}
          aria-describedby={formState.errors.email ? emailErrorId : (formState.isRateLimited ? 'rate-limit-msg' : undefined)}
          autoFocus={!formState.isRateLimited}
        />
        {formState.errors.email && (
          <p id={emailErrorId} className="text-red-500 text-sm" role="alert" aria-live="polite">
            {formState.errors.email}
          </p>
        )}
      </div>
      {formState.errors.form && (
        <p id={formErrorId} className="text-red-500 text-sm" role="alert" aria-live="polite">
          {formState.errors.form}
        </p>
      )}
      {formState.isRateLimited && (
        <p id="rate-limit-msg" className="text-red-500 text-sm text-center" role="alert" aria-live="polite">
          Please wait 30 seconds. Too many requests.
        </p>
      )}
      <Button
        type="submit"
        disabled={!formState.isValid || formState.isSubmitting || formState.isRateLimited}
        className="w-full"
      >
        {formState.isSubmitting ? 'Sending...' : (formState.isRateLimited ? 'Wait...' : 'Send Reset Link')}
      </Button>
    </form>
  );
}
