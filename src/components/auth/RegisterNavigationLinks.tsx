export function RegisterNavigationLinks() {
  return (
    <div className="flex w-full flex-col gap-2 text-center text-sm">
      <div className="text-muted-foreground">
        Already have an account?{' '}
        <a 
          href="/login" 
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}
