export function NavigationLinks() {
  return (
    <div className="flex w-full flex-col gap-2 text-center text-sm">
      <div className="text-muted-foreground">
        Don't have an account?{' '}
        <a 
          href="/register" 
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Sign up
        </a>
      </div>
      <div>
        <a 
          href="/reset-password" 
          className="text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          Forgot password?
        </a>
      </div>
    </div>
  );
}

