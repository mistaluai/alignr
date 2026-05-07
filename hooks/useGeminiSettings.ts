"use client";

import { useState, useEffect } from "react";

export type GeminiModel = "gemini-3.1-pro-preview" | "gemini-3-pro-preview" | "gemini-2.5-pro" | "gemini-2.5-flash";

interface GeminiSettings {
    apiKey: string;
    model: GeminiModel;
}

const STORAGE_KEY = "alignr-gemini-settings";

export function useGeminiSettings() {
    const [settings, setSettings] = useState<GeminiSettings>({
        apiKey: "",
        model: "gemini-2.5-flash",
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSettings(parsed);
            } catch (e) {
                console.error("Failed to parse gemini settings", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const updateSettings = (newSettings: Partial<GeminiSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return {
        ...settings,
        updateSettings,
        isLoaded,
    };
}
