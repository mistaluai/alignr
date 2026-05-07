"use client";

import { useState, useEffect, useCallback } from "react";

export type GeminiModel = "gemini-3.1-pro-preview" | "gemini-3-pro-preview" | "gemini-2.5-pro" | "gemini-2.5-flash";

interface GeminiSettings {
    apiKey: string;
    model: GeminiModel;
}

const STORAGE_KEY = "alignr-gemini-settings";
const DEFAULT_SETTINGS: GeminiSettings = {
    apiKey: "",
    model: "gemini-2.5-flash",
};

export function useGeminiSettings() {
    // 1. Initialize state lazily
    const [settings, setSettings] = useState<GeminiSettings>(() => {
        // Safety check for SSR (Server Side Rendering)
        if (typeof window === "undefined") return DEFAULT_SETTINGS;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate that we have meaningful data
                if (parsed.apiKey || parsed.model) {
                    return { ...DEFAULT_SETTINGS, ...parsed };
                }
            }
        } catch (e) {
            console.error("Failed to parse gemini settings from localStorage", e);
        }

        return DEFAULT_SETTINGS;
    });

    const [isLoaded, setIsLoaded] = useState(false);

    // 2. Signal that hydration is complete
    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // 3. Update logic remains robust with functional updates
    const updateSettings = useCallback((newSettings: Partial<GeminiSettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };

            // Persist to localStorage
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }

            return updated;
        });
    }, []);

    return {
        ...settings,
        updateSettings,
        isLoaded,
    };
}