import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-8 max-w-xl">
        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome Back 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Access your dashboard and manage everything seamlessly.
          </p>
        </div>

        {/* Minimal Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="px-6 py-3 rounded-xl border border-border font-medium hover:bg-muted transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}