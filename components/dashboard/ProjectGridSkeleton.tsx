import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export function ProjectGridSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="relative overflow-hidden p-5 border-border">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="h-5 w-3/4 bg-border rounded" />
                            <div className="space-y-2">
                                <div className="h-3 w-1/2 bg-border/60 rounded" />
                                <div className="h-3 w-1/2 bg-border/60 rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-16 bg-border rounded-full" />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <div className="h-4 w-12 bg-border/60 rounded" />
                    </div>
                </Card>
            ))}
        </div>
    );
}