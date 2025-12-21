export function SignupNavigationLinks() {
  return (
    <div className="flex w-full flex-col gap-4 text-center text-sm">
      <div className="text-slate-500">
        Already have an account?{' '}
        <a
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          Sign in
        </a>
      </div>
      <div className="flex justify-center gap-4 pt-6 mt-2 border-t border-slate-100">
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
