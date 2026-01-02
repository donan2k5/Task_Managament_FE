import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Settings as SettingsIcon, 
  Keyboard, 
  Bell, 
  Palette, 
  User,
  Shield,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = [
  { category: "Navigation", shortcuts: [
    { keys: ["H"], description: "Go to Home" },
    { keys: ["T"], description: "Go to Tasks" },
    { keys: ["M"], description: "Go to Matrix" },
    { keys: ["C"], description: "Go to Calendar" },
    { keys: ["P"], description: "Go to Pomodoro" },
    { keys: ["B"], description: "Go to Habits" },
    { keys: ["?"], description: "Go to Settings" },
  ]},
  { category: "General", shortcuts: [
    { keys: ["Esc"], description: "Close dialog/panel" },
  ]},
];

type SettingsTab = "general" | "shortcuts" | "notifications" | "appearance" | "account" | "help";

const SETTINGS_TABS = [
  { id: "general" as const, label: "General", icon: SettingsIcon },
  { id: "shortcuts" as const, label: "Keyboard Shortcuts", icon: Keyboard },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "appearance" as const, label: "Appearance", icon: Palette },
  { id: "account" as const, label: "Account", icon: User },
  { id: "help" as const, label: "Help & Support", icon: HelpCircle },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("shortcuts");

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
          <p className="text-zinc-500 mt-1">Manage your preferences and account settings</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <nav className="space-y-1">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    activeTab === tab.id 
                      ? "bg-indigo-50 text-indigo-700 font-medium" 
                      : "text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <Card className="p-6 border-zinc-200">
              {activeTab === "shortcuts" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Keyboard Shortcuts
                  </h2>
                  
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-8">
                      {KEYBOARD_SHORTCUTS.map((section) => (
                        <div key={section.category}>
                          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                            {section.category}
                          </h3>
                          <div className="space-y-3">
                            {section.shortcuts.map((shortcut, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50"
                              >
                                <span className="text-zinc-700">{shortcut.description}</span>
                                <div className="flex items-center gap-1">
                                  {shortcut.keys.map((key, keyIdx) => (
                                    <span key={keyIdx}>
                                      <kbd className="px-2 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-md shadow-sm">
                                        {key}
                                      </kbd>
                                      {keyIdx < shortcut.keys.length - 1 && (
                                        <span className="mx-1 text-zinc-400">+</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {activeTab === "general" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    General Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-save changes</Label>
                        <p className="text-sm text-zinc-500">Automatically save your work as you type</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Show completed tasks</Label>
                        <p className="text-sm text-zinc-500">Display completed tasks in the task list</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Start week on Monday</Label>
                        <p className="text-sm text-zinc-500">Calendar starts on Monday instead of Sunday</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Task reminders</Label>
                        <p className="text-sm text-zinc-500">Get notified before task deadlines</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Pomodoro notifications</Label>
                        <p className="text-sm text-zinc-500">Get notified when timer completes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Daily summary</Label>
                        <p className="text-sm text-zinc-500">Receive a daily productivity summary</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </h2>
                  <p className="text-zinc-500">Theme customization coming soon...</p>
                </div>
              )}

              {activeTab === "account" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Settings
                  </h2>
                  <p className="text-zinc-500">Account management coming soon...</p>
                </div>
              )}

              {activeTab === "help" && (
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Help & Support
                  </h2>
                  <p className="text-zinc-500">Help documentation coming soon...</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
