export function RegisterNavigationLinks() {
  return (
    <div className="flex w-full flex-col gap-2 text-center text-sm">
      <div className="text-muted-foreground">
        Already have an account?{' '}
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm cursor-pointer"
        >
          Sign in
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 mt-8 border-t border-border/50 max-w-[240px] mx-auto">
        <a
          href="/terms"
          className="inline-block text-xs text-muted-foreground/60 hover:text-primary hover:font-medium hover:-translate-y-0.5 transition-all duration-200"
        >
          Terms of Service
        </a>
        <a
          href="/privacy"
          className="inline-block text-xs text-muted-foreground/60 hover:text-primary hover:font-medium hover:-translate-y-0.5 transition-all duration-200"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
