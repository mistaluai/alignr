import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";
import { LogOut, Zap } from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-bg-secondary/80 px-6 backdrop-blur-md">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg transition-colors hover:text-accent"
        >
          <Zap className="h-5 w-5 text-accent" />
          <span>
            <span className="text-accent">A</span>lignr
          </span>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-bg-tertiary hover:text-fg cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </header>

      {/* Page content */}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
