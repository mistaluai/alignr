"use client";

import { useState, useEffect } from "react";
import { Settings, X, Key, Cpu, Save } from "lucide-react";
import { useGeminiSettings, GeminiModel } from "@/hooks/useGeminiSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export function GeminiSettingsDialog() {
  const [open, setOpen] = useState(false);
  const { apiKey, model, updateSettings, isLoaded } = useGeminiSettings();

  const [localKey, setLocalKey] = useState("");
  const [localModel, setLocalModel] = useState<GeminiModel>("gemini-2.5-flash");

  useEffect(() => {
    if (isLoaded) {
      setLocalKey(apiKey);
      setLocalModel(model);
    }
  }, [apiKey, model, isLoaded]);

  const handleSave = () => {
    updateSettings({
      apiKey: localKey,
      model: localModel,
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors"
        title="Gemini Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1 text-fg-muted hover:text-fg hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Gemini Settings
          </CardTitle>
          <p className="text-sm text-fg-muted mt-1">
            Configure your Gemini API key and model preferences. These are stored locally in your browser, they never touch our database.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5" />
              Gemini API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Paste your API key here…"
              className="bg-bg-secondary"
            />
            <p className="text-[11px] text-fg-muted">
              Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent hover:underline">Google AI Studio</a>.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select" className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5" />
              Model Selection
            </Label>
            <Select
              id="model-select"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value as GeminiModel)}
            >
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Best Model)</option>
              <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest Model)</option>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
