import React from "react";

interface StructuredDataViewerProps {
    data: any;
}

export function StructuredDataViewer({ data }: StructuredDataViewerProps) {
    if (!data || typeof data !== "object") return <p className="text-sm text-fg-muted">No data available.</p>;

    const renderNode = (value: any): React.ReactNode => {
        if (typeof value === 'string' || typeof value === 'number') {
            return <span className="text-sm text-fg/90">{value}</span>;
        }
        if (typeof value === 'boolean') {
            return <span className="text-sm text-fg/90">{value ? 'Yes' : 'No'}</span>;
        }
        if (Array.isArray(value)) {
            // If it's an array of strings (e.g., tech stack lists), render as nice badges
            if (value.every(v => typeof v === 'string')) {
                return (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {value.map((item, i) => (
                            <span key={i} className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-md border border-accent/20">
                                {item}
                            </span>
                        ))}
                    </div>
                );
            }
            // If complex array, render as a list
            return (
                <ul className="space-y-3 mt-2">
                    {value.map((item, i) => (
                        <li key={i} className="border-l-2 border-border/60 pl-3">
                            {renderNode(item)}
                        </li>
                    ))}
                </ul>
            );
        }
        if (typeof value === 'object' && value !== null) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k} className="space-y-1">
                            <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider block">
                                {k.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div>{renderNode(v)}</div>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="space-y-3">
                    <h4 className="text-sm font-bold text-fg capitalize border-b border-border/50 pb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="bg-bg-secondary/50 rounded-lg p-4 border border-border/50">
                        {renderNode(value)}
                    </div>
                </div>
            ))}
        </div>
    );
}