import { Zap } from "lucide-react";
import { GuestCommandCenter } from "./GuestCommandCenter";

export default function TryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Slim header for guest mode */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-bg-secondary/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
          <Zap className="h-5 w-5 text-accent" />
          <span>
            <span className="text-accent">A</span>lignr
          </span>
          <span className="ml-2 rounded-full bg-stage-architecture/10 border border-stage-architecture/20 px-2 py-0.5 text-[10px] font-medium text-stage-architecture">
            Guest
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <GuestCommandCenter />
      </main>
    </div>
  );
}
