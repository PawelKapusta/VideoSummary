export function NavigationLinks() {
  return (
    <div className="flex w-full flex-col gap-3 text-center text-sm">
      <div className="text-slate-500">
        Don't have an account?{' '}
        <a
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Create one now
        </a>
      </div>
      <div>
        <a
          href="/reset-password"
          className="font-semibold text-slate-600 hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
        >
          Forgot your password?
        </a>
      </div>
      <div className="flex justify-center gap-4 pt-5 mt-1 border-t border-slate-100">
        <a
          href="/terms"
          className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          Terms
        </a>
        <a
          href="/privacy"
          className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          Privacy
        </a>
      </div>
    </div>
  );
}
