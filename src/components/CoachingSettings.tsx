// src/components/CoachingSettings.tsx
"use client";

import React from "react";
import { toastManager, CoachingSettings } from "@/lib/toast-manager";
import { Settings, Volume, VolumeX, Volume1, Volume2 } from "lucide-react";

export function CoachingSettingsPanel() {
  const [settings, setSettings] = React.useState(toastManager.getSettings());
  const [isOpen, setIsOpen] = React.useState(false);

  const updateSetting = (key: keyof CoachingSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    toastManager.updateSettings(newSettings);
  };

  const getVerbosityIcon = () => {
    switch (settings.verbosity) {
      case "silent":
        return <VolumeX className="w-4 h-4" />;
      case "minimal":
        return <Volume1 className="w-4 h-4" />;
      case "normal":
        return <Volume className="w-4 h-4" />;
      case "verbose":
        return <Volume2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
        title="Coaching Settings"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl z-50">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Coaching Settings
          </h3>

          {/* Verbosity */}
          <div className="mb-4">
            <label className="text-white/80 text-sm mb-2 flex items-center gap-2">
              {getVerbosityIcon()}
              Feedback Level
            </label>
            <select
              value={settings.verbosity}
              onChange={(e) => updateSetting("verbosity", e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="silent">Silent (No feedback)</option>
              <option value="minimal">Minimal (Mistakes only)</option>
              <option value="normal">Normal (Recommended)</option>
              <option value="verbose">Verbose (All feedback)</option>
            </select>
          </div>

          {/* Show Only Blunders */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showOnlyBlunders}
                onChange={(e) =>
                  updateSetting("showOnlyBlunders", e.target.checked)
                }
                className="w-4 h-4 rounded"
              />
              Show only critical mistakes
            </label>
          </div>

          {/* Max Toasts */}
          <div className="mb-4">
            <label className="text-white/80 text-sm mb-2 block">
              Max notifications: {settings.maxToasts}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={settings.maxToasts}
              onChange={(e) =>
                updateSetting("maxToasts", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Auto Dismiss */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoDismiss}
                onChange={(e) => updateSetting("autoDismiss", e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Auto-dismiss notifications
            </label>
          </div>

          <div className="text-xs text-white/50 mt-4 pt-4 border-t border-white/10">
            💡 Tip: Use "Normal" for balanced feedback
          </div>
        </div>
      )}
    </div>
  );
}
