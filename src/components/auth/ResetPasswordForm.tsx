import { type FormEvent, type ChangeEvent } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="email"
          className={`text-sm font-semibold ${formState.errors.email ? 'text-red-500' : 'text-slate-700'}`}
        >
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formState.data.email}
          onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
          disabled={formState.isSubmitting || formState.isRateLimited}
          className={`bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all duration-200 rounded-xl h-11 ${(formState.errors.email || formState.isRateLimited) ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
          aria-invalid={!!formState.errors.email || formState.isRateLimited}
          aria-describedby={formState.errors.email ? emailErrorId : (formState.isRateLimited ? 'rate-limit-msg' : undefined)}
        />
        {formState.errors.email && (
          <p id={emailErrorId} className="text-red-500 text-sm" role="alert">
            {formState.errors.email}
          </p>
        )}
      </div>

      {formState.errors.form && (
        <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
          {formState.errors.form}
        </p>
      )}

      {formState.isRateLimited && (
        <p id="rate-limit-msg" className="text-amber-600 text-sm text-center font-medium bg-amber-50 p-3 rounded-lg border border-amber-100" role="alert">
          Too many requests. Please wait 30 seconds.
        </p>
      )}

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="submit"
          disabled={!formState.isValid || formState.isSubmitting || formState.isRateLimited}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
        >
          {formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : 'Send Reset Link'}
        </Button>
      </motion.div>
    </form>
  );
}
