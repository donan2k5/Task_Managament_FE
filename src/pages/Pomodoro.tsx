"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTaskContext } from "@/context/TaskContext";
import { taskService } from "@/services/task.service";
import { pomodoroService } from "@/services/pomodoro.service";
import { Pause, RotateCcw, CheckCircle2, Maximize2, Minimize2, Volume2, Image as ImageIcon, StickyNote, X, Shield, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

type TimerMode = "focus" | "shortBreak" | "longBreak";

// Timer duration presets in minutes
const TIMER_PRESETS = [15, 25, 30, 45, 60];

const MODES: Record<TimerMode, { label: string; defaultMinutes: number; color: string }> = {
  focus: { label: "Focus", defaultMinutes: 25, color: "text-white" },
  shortBreak: { label: "Short Break", defaultMinutes: 5, color: "text-emerald-200" },
  longBreak: { label: "Long Break", defaultMinutes: 15, color: "text-blue-200" },
};

// Background image categories
interface BackgroundImage {
  id: string;
  label: string;
  url: string;
}

interface BackgroundCategory {
  label: string;
  images: BackgroundImage[];
}

const BACKGROUND_CATEGORIES: Record<string, BackgroundCategory> = {
  vibrant: {
    label: "🌈 Vibrant",
    images: [
      { id: "neon_city", label: "Neon City", url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=2070&auto=format&fit=crop" },
      { id: "colorful_wall", label: "Color Burst", url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2070&auto=format&fit=crop" },
      { id: "sunset_sky", label: "Sunset Sky", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=2070&auto=format&fit=crop" },
      { id: "aurora", label: "Northern Lights", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop" },
      { id: "gradient_purple", label: "Purple Dream", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop" },
    ]
  },
  landscape: {
    label: "🏞️ Landscape",
    images: [
      { id: "mountains", label: "Mountains", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" },
      { id: "beach", label: "Beach Sunset", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" },
      { id: "forest_path", label: "Forest Path", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop" },
      { id: "lake", label: "Mountain Lake", url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=2073&auto=format&fit=crop" },
    ]
  },
  cozy: {
    label: "🏠 Cozy",
    images: [
      { id: "coffee_desk", label: "Coffee & Desk", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop" },
      { id: "window_rain", label: "Rainy Window", url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2560&auto=format&fit=crop" },
      { id: "library", label: "Library", url: "https://images.unsplash.com/photo-1507842217153-e52fbc5f0f0c?q=80&w=2940&auto=format&fit=crop" },
      { id: "lofi_room", label: "Lofi Room", url: "https://images.unsplash.com/photo-1555679427-1f6dfcce943b?q=80&w=2670&auto=format&fit=crop" },
    ]
  },
  nature: {
    label: "🌿 Nature",
    images: [
      { id: "misty_forest", label: "Misty Forest", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop" },
      { id: "waterfall", label: "Waterfall", url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=2070&auto=format&fit=crop" },
      { id: "cherry_blossom", label: "Cherry Blossom", url: "https://images.unsplash.com/photo-1522383225653-a7e4ca837d0d?q=80&w=2076&auto=format&fit=crop" },
      { id: "tropical", label: "Tropical Beach", url: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=2073&auto=format&fit=crop" },
    ]
  }
};

// Flatten for easy access
const ALL_BACKGROUNDS = Object.values(BACKGROUND_CATEGORIES).flatMap(cat => cat.images);

// Ambient sounds with reliable free-to-use URLs
const SOUNDS = [
  { id: "none", label: "None", url: "", icon: "🔇" },
  { id: "rain", label: "Rainfall", url: "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3", icon: "🌧️" },
  { id: "forest", label: "Forest", url: "https://assets.mixkit.co/active_storage/sfx/1214/1214-preview.mp3", icon: "🌲" },
  { id: "waves", label: "Ocean Waves", url: "https://assets.mixkit.co/active_storage/sfx/211/211-preview.mp3", icon: "🌊" },
  { id: "fire", label: "Fireplace", url: "https://assets.mixkit.co/active_storage/sfx/1102/1102-preview.mp3", icon: "🔥" },
  { id: "birds", label: "Birds", url: "https://assets.mixkit.co/active_storage/sfx/1211/1211-preview.mp3", icon: "🐦" },
  { id: "thunder", label: "Thunder", url: "https://assets.mixkit.co/active_storage/sfx/1166/1166-preview.mp3", icon: "⛈️" },
  { id: "wind", label: "Wind", url: "https://assets.mixkit.co/active_storage/sfx/2525/2525-preview.mp3", icon: "💨" },
  { id: "night", label: "Night Crickets", url: "https://assets.mixkit.co/active_storage/sfx/2541/2541-preview.mp3", icon: "🌙" },
];

const Pomodoro = () => {
  const { user } = useAuth();
  const { tasks: allTasks, updateTask } = useTaskContext();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | "nocode">("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derive pending tasks from context
  const tasks = allTasks.filter(t => !t.completed);

  // Settings
  const [bgImage, setBgImage] = useState(ALL_BACKGROUNDS[0].url);
  const [activeSounds, setActiveSounds] = useState<Record<string, number>>({}); // soundId -> volume (0-100)
  const [masterVolume, setMasterVolume] = useState(70);
  const [note, setNote] = useState("");
  const [sessionNotes, setSessionNotes] = useState<Array<{id: string; text: string; time: Date}>>([]);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  // URL Blocking
  const [blockedUrls, setBlockedUrls] = useState<string[]>([]);
  const [newBlockedUrl, setNewBlockedUrl] = useState("");
  const [isBlockingEnabled, setIsBlockingEnabled] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("https://www.youtube.com/watch?v=jfKfPfyJRdk");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  /* removed useQuery for tasks - using context */

  const createSessionMutation = useMutation({
    mutationFn: pomodoroService.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoro-history"] });
    }
  });

  const selectedTask = tasks.find(t => t._id === selectedTaskId);

  // Multi-sound audio management
  useEffect(() => {
    const activeSoundIds = Object.keys(activeSounds);

    // Start/update active sounds
    activeSoundIds.forEach(soundId => {
      const sound = SOUNDS.find(s => s.id === soundId);
      if (!sound || !sound.url) return;

      const soundVolume = activeSounds[soundId];
      const effectiveVolume = (soundVolume / 100) * (masterVolume / 100);

      if (isActive) {
        // Create audio if doesn't exist
        if (!audioRefs.current[soundId]) {
          audioRefs.current[soundId] = new Audio(sound.url);
          audioRefs.current[soundId].loop = true;
        }
        audioRefs.current[soundId].volume = effectiveVolume;
        audioRefs.current[soundId].play().catch(() => {});
      } else {
        // Pause when timer is not active
        if (audioRefs.current[soundId]) {
          audioRefs.current[soundId].pause();
        }
      }
    });

    // Stop sounds that are no longer active
    Object.keys(audioRefs.current).forEach(soundId => {
      if (!activeSoundIds.includes(soundId)) {
        audioRefs.current[soundId].pause();
        delete audioRefs.current[soundId];
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => audio.pause());
    };
  }, [activeSounds, isActive, masterVolume]);

  // Toggle a sound on/off
  const toggleSound = (soundId: string) => {
    if (soundId === "none") {
      setActiveSounds({});
      return;
    }
    setActiveSounds(prev => {
      if (prev[soundId] !== undefined) {
        const { [soundId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [soundId]: 70 }; // Default volume 70%
    });
  };

  // Adjust individual sound volume
  const setSoundVolume = (soundId: string, vol: number) => {
    setActiveSounds(prev => ({ ...prev, [soundId]: vol }));
  };

  // Load saved settings
  useEffect(() => {
    const savedEnd = localStorage.getItem("pomo_endTime");
    const savedMode = localStorage.getItem("pomo_mode") as TimerMode;
    const savedTask = localStorage.getItem("pomo_taskId");
    const savedBg = localStorage.getItem("pomo_bg");
    const savedSounds = localStorage.getItem("pomo_sounds");
    const savedMasterVol = localStorage.getItem("pomo_masterVol");
    const savedNote = localStorage.getItem("pomo_note");
    const savedMinutes = localStorage.getItem("pomo_minutes");
    const savedBlocked = localStorage.getItem("pomo_blocked");

    if (savedBg) setBgImage(savedBg);
    if (savedSounds) {
      try {
        const parsed = JSON.parse(savedSounds);
        setActiveSounds(parsed || {});
      } catch (e) {
        console.error("Failed to parse saved sounds", e);
      }
    }
    if (savedMasterVol) setMasterVolume(parseInt(savedMasterVol, 10));
    if (savedNote) setNote(savedNote);
    if (savedMinutes) setCustomMinutes(parseInt(savedMinutes, 10));
    if (savedBlocked) {
      try {
         const parsed = JSON.parse(savedBlocked);
         setBlockedUrls(parsed || []);
      } catch (e) {
        console.error("Failed to parse blocked urls", e);
      }
    }

    if (savedEnd && savedMode) {
      const end = parseInt(savedEnd, 10);
      const now = Date.now();
      if (end > now) {
        setMode(savedMode);
        setTimeLeft(Math.ceil((end - now) / 1000));
        setIsActive(true);
        if (savedTask) setSelectedTaskId(savedTask);
      } else {
        localStorage.removeItem("pomo_endTime");
        localStorage.removeItem("pomo_mode");
        localStorage.removeItem("pomo_taskId");
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    if (isActive) {
      const endTime = Date.now() + timeLeft * 1000;
      localStorage.setItem("pomo_endTime", endTime.toString());
      localStorage.setItem("pomo_mode", mode);
      if (selectedTaskId) localStorage.setItem("pomo_taskId", selectedTaskId);
    } else {
      localStorage.removeItem("pomo_endTime");
    }

    localStorage.setItem("pomo_bg", bgImage);
    localStorage.setItem("pomo_sounds", JSON.stringify(activeSounds));
    localStorage.setItem("pomo_masterVol", masterVolume.toString());
    localStorage.setItem("pomo_note", note);
    localStorage.setItem("pomo_minutes", customMinutes.toString());
    localStorage.setItem("pomo_blocked", JSON.stringify(blockedUrls));
  }, [isActive, mode, selectedTaskId, timeLeft, bgImage, activeSounds, masterVolume, note, customMinutes, blockedUrls]);

  // Add note to session
  const addSessionNote = () => {
    if (!note.trim()) return;
    setSessionNotes(prev => [...prev, { id: Date.now().toString(), text: note, time: new Date() }]);
    setNote("");
    toast.success("Note added!");
  };

  const removeSessionNote = (id: string) => {
    setSessionNotes(prev => prev.filter(n => n.id !== id));
  };

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isActive) {
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.success(`${MODES[mode].label} session completed!`);
        
        const fullDuration = customMinutes * 60;
        createSessionMutation.mutate({
          startTime: new Date(Date.now() - fullDuration * 1000).toISOString(),
          endTime: new Date().toISOString(),
          duration: fullDuration,
          mode: mode,
          note: note || undefined,
          taskId: selectedTaskId !== "nocode" ? selectedTaskId : undefined
        });

        localStorage.removeItem("pomo_endTime");
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  // Mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    if (isActive) return;
    setMode(newMode);
    setCustomMinutes(MODES[newMode].defaultMinutes);
    setTimeLeft(MODES[newMode].defaultMinutes * 60);
  };

  // Timer preset change
  const handlePresetChange = (minutes: number) => {
    if (isActive) return;
    setCustomMinutes(minutes);
    setTimeLeft(minutes * 60);
  };

  const toggleTimer = () => {
    if (!isActive && mode === "focus") {
      setIsBlockingEnabled(true);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(customMinutes * 60);
    setIsBlockingEnabled(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskId || selectedTaskId === "nocode") return;
    try {
      await updateTask(selectedTaskId, { completed: true, status: "done" });
      toast.success("Task completed!");
      setSelectedTaskId("");
    } catch {
      toast.error("Failed to complete task");
    }
  };

  const addBlockedUrl = () => {
    if (!newBlockedUrl.trim()) return;
    const url = newBlockedUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!blockedUrls.includes(url)) {
      setBlockedUrls([...blockedUrls, url]);
    }
    setNewBlockedUrl("");
  };

  const removeBlockedUrl = (url: string) => {
    setBlockedUrls(blockedUrls.filter(u => u !== url));
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSetYoutube = () => {
    const id = extractYoutubeId(youtubeLink);
    if (id) {
        setYoutubeVideoId(id);
        toast.success("Video added!");
    } else {
        toast.error("Invalid YouTube URL");
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white transition-all duration-700 font-sans group/ui"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Dark Overlay for Readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[0px] transition-all duration-1000" />
        
        {/* Top Bar: Brand & Quote */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">axis.</h1>
                <p className="text-sm text-white/80 font-medium drop-shadow-sm">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name || "User"}</p>
            </div>
            <div className="text-right max-w-xs hidden md:block">
                <p className="text-sm font-medium text-white/90 italic drop-shadow-md">"The old ways won't open new doors"</p>
            </div>
        </div>

        {/* Blocking Active Alert */}
        <AnimatePresence>
            {isBlockingEnabled && isActive && blockedUrls.length > 0 && (
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md text-white px-5 py-2 rounded-full flex items-center gap-2 text-xs font-semibold shadow-lg border border-white/10"
            >
                <Shield className="w-3 h-3 text-emerald-400" />
                FOCUS MODE ACTIVE
            </motion.div>
            )}
        </AnimatePresence>


        {/* CENTER STAGE */}
        <div className="relative z-10 flex flex-col items-center justify-center h-screen w-full px-4">
            
            {/* Task Display / Selector (Compact Pill) */}
            <div className="mb-8 relative z-30 group">
                <AnimatePresence mode="wait">
                    {isActive ? (
                         <motion.div
                            key="active-task" 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 bg-black/40 hover:bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 transition-all cursor-default"
                         >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-white font-medium text-lg drop-shadow-sm">
                                {selectedTaskId && selectedTaskId !== "nocode" ? selectedTask?.title : "Deep Work Session"}
                            </span>
                            {selectedTaskId && selectedTaskId !== "nocode" && (
                                <button onClick={handleCompleteTask} className="ml-2 text-white/60 hover:text-emerald-400 transition-colors" title="Complete Task">
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                         </motion.div>
                    ) : (
                        <motion.div
                             key="select-task"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                        >
                             <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                                <SelectTrigger className="w-auto min-w-[300px] h-12 bg-black/30 hover:bg-black/40 backdrop-blur-md border-transparent hover:border-white/10 rounded-2xl text-white text-lg font-medium shadow-lg transition-all text-center justify-center border border-white/5">
                                    <span className="mr-2 text-white/60 font-normal">Focusing on:</span>
                                    <SelectValue placeholder="Select a task..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900/90 backdrop-blur-xl border-slate-700 text-white">
                                    <SelectItem value="nocode">General Focus</SelectItem>
                                    {tasks.map(t => (
                                        <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mode Switcher (Capsule) */}
            <div className="flex p-1 bg-black/30 backdrop-blur-md rounded-full border border-white/5 mb-6 shadow-xl">
                 {(Object.keys(MODES) as TimerMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        disabled={isActive}
                        className={cn(
                        "px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                        mode === m
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                            : "text-white/60 hover:text-white hover:bg-white/5",
                        isActive && mode !== m && "opacity-30 cursor-not-allowed"
                        )}
                    >
                        {MODES[m].label}
                    </button>
                    ))}
            </div>


            {/* MASSIVE TIMER */}
            <div className="relative text-center mb-8">
                <div 
                    className={cn(
                        "font-bold text-[140px] md:text-[180px] leading-none text-white drop-shadow-2xl tabular-nums tracking-tight select-none transition-transform duration-500",
                        isActive ? "scale-105" : "scale-100"
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {formatTime(timeLeft)}
                </div>

                {/* Primary Action Button (Pill under timer) */}
                <div className="flex items-center justify-center gap-3 mt-4">
                     {isActive ? (
                         <>
                            <button 
                                onClick={toggleTimer}
                                className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-200 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Pause className="w-5 h-5 fill-current" /> PAUSE
                            </button>
                            <button 
                                onClick={() => {
                                    resetTimer();
                                    setIsActive(false);
                                }}
                                className="w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                         </>
                     ) : (
                         <button 
                            onClick={toggleTimer}
                            className="h-14 px-10 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 flex items-center gap-2"
                         >
                            START FOCUS
                         </button>
                     )}
                </div>
            </div>

            {/* Presets (Visible only when inactive) */}
            {!isActive && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 mt-4"
                >
                     {TIMER_PRESETS.map(min => (
                         <button 
                            key={min}
                            onClick={() => handlePresetChange(min)}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border transition-all",
                                customMinutes === min ? "bg-white text-slate-900 border-white" : "bg-transparent text-white/50 border-white/10 hover:border-white/40 hover:text-white"
                            )}
                         >
                             {min}
                         </button>
                     ))}
                </motion.div>
            )}

        </div>


        {/* BOTTOM RIGHT: SETTINGS DOCK (Compact) */}
        <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-opacity duration-300 opacity-80 hover:opacity-100">
            
            {/* Backgrounds */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-slate-900/90 border-slate-700 backdrop-blur-xl p-3 mr-4 mb-2">
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                        {ALL_BACKGROUNDS.map(bg => (
                            <div 
                                key={bg.id}
                                className={cn(
                                    "aspect-video rounded bg-cover bg-center cursor-pointer border-2 transition-all hover:opacity-100",
                                    bgImage === bg.url ? "border-purple-500 opacity-100" : "border-transparent opacity-60"
                                )}
                                style={{ backgroundImage: `url(${bg.url})` }}
                                onClick={() => setBgImage(bg.url)}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Sounds */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "p-3 rounded-xl hover:bg-white/10 transition-all relative",
                        Object.keys(activeSounds).length > 0 ? "text-purple-400 bg-purple-500/10" : "text-white/70 hover:text-white"
                    )}>
                        <Volume2 className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-slate-900/90 border-slate-700 backdrop-blur-xl p-4 mr-4 mb-2 text-white">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-sm">Mixer</h4>
                        <button onClick={() => setActiveSounds({})} className="text-xs text-white/40 hover:text-white">Clear</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {SOUNDS.filter(s => s.id !== "none").map(sound => {
                            const isActive = activeSounds[sound.id] !== undefined;
                            return (
                                <button
                                    key={sound.id}
                                    onClick={() => toggleSound(sound.id)}
                                    className={cn(
                                        "flex flex-col items-center p-2 rounded-lg border transition-all gap-1",
                                        isActive ? "bg-purple-500/20 border-purple-500/50" : "border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <span className="text-xl">{sound.icon}</span>
                                    <span className="text-[10px] text-white/60">{sound.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
            
            <div className="w-px h-6 bg-white/10" />

            {/* Notes */}
            <button onClick={() => setIsNoteOpen(true)} className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all relative">
                <StickyNote className="w-5 h-5" />
                {sessionNotes.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full" />}
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-3 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all">
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

             {/* Focus Guard */}
            <Popover>
               <PopoverTrigger asChild>
                  <button className={cn(
                    "p-3 rounded-xl hover:bg-white/10 transition-all",
                    isBlockingEnabled ? "text-rose-400 bg-rose-500/10" : "text-white/70 hover:text-white"
                  )}>
                      <Shield className="w-5 h-5" />
                  </button>
               </PopoverTrigger>
               <PopoverContent className="w-64 bg-slate-900/90 border-slate-700 backdrop-blur-xl p-4 mr-4 mb-2 text-white">
                    <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-semibold">Focus Guard</span>
                         <button 
                            onClick={() => setIsBlockingEnabled(!isBlockingEnabled)}
                            className={cn("w-8 h-4 rounded-full relative transition-colors", isBlockingEnabled ? "bg-rose-500" : "bg-white/20")}
                         >
                            <span className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", isBlockingEnabled ? "left-4.5" : "left-0.5")} />
                         </button>
                    </div>
                    <div className="space-y-2">
                        <Input 
                            value={newBlockedUrl}
                            onChange={e => setNewBlockedUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addBlockedUrl()}
                            placeholder="Add blocked site..."
                            className="h-8 text-xs bg-black/30 border-white/10 text-white placeholder:text-white/20"
                        />
                        <div className="flex flex-wrap gap-1">
                            {blockedUrls.map(url => (
                                <span key={url} className="px-1.5 py-0.5 bg-rose-500/20 text-rose-200 text-[10px] rounded flex items-center gap-1 border border-rose-500/30">
                                    {url} <button onClick={() => removeBlockedUrl(url)}><X className="w-2 h-2" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
               </PopoverContent>
            </Popover>

        </div>


        {/* BOTTOM LEFT: Spotify/Music Placeholder */}
        <div className="absolute bottom-6 left-6 z-40 group">
             {/* YouTube Link Input (Disguised as Music Widget) */}
             <div className="flex items-center gap-3 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl pr-4 transition-all hover:bg-black/50 hover:border-white/20">
                 <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center transition-all overflow-hidden relative",
                     youtubeVideoId ? "bg-black" : "bg-gradient-to-br from-indigo-500 to-purple-500"
                 )}>
                     {youtubeVideoId ? (
                         <div className="absolute inset-0 z-10 bg-transparent" /> 
                     ) : (
                         <Youtube className="w-6 h-6 text-white" />
                     )}
                     {youtubeVideoId && (
                         <iframe
                            className="w-full h-full opacity-60 pointer-events-none scale-150"
                            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=0&loop=1&playlist=${youtubeVideoId}&mute=1`} 
                         />
                     )}
                 </div>
                 <div className="flex flex-col min-w-[140px]">
                     <span className="text-xs font-bold text-white/90">Ambient Sound</span>
                     {youtubeVideoId ? (
                        <div className="flex items-center gap-2">
                             <div className="flex gap-0.5 h-3 items-end">
                                 <motion.div animate={{ height: [4, 12, 6, 12] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1 bg-emerald-400 rounded-full" />
                                 <motion.div animate={{ height: [10, 5, 12, 8] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-1 bg-emerald-400 rounded-full" />
                                 <motion.div animate={{ height: [6, 12, 4, 10] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1 bg-emerald-400 rounded-full" />
                             </div>
                             <button onClick={() => setYoutubeVideoId(null)} className="text-[10px] text-white/50 hover:text-red-400">Stop</button>
                        </div>
                     ) : (
                         <Popover>
                             <PopoverTrigger asChild>
                                <button className="text-[10px] text-white/50 hover:text-white text-left truncate w-full">Set YouTube Link</button>
                             </PopoverTrigger>
                             <PopoverContent className="w-64 bg-slate-900/90 border-slate-700 p-2 ml-4 mb-2 backdrop-blur-xl">
                                <div className="flex gap-2">
                                    <Input 
                                        value={youtubeLink}
                                        onChange={e => setYoutubeLink(e.target.value)}
                                        placeholder="YouTube URL..."
                                        className="h-8 text-xs bg-black/30 border-white/10 text-white" 
                                    />
                                    <Button size="sm" onClick={handleSetYoutube} className="h-8 bg-purple-600 hover:bg-purple-700">Go</Button>
                                </div>
                             </PopoverContent>
                         </Popover>
                     )}
                 </div>
             </div>
             
             {/* Hidden Real Player */}
             {youtubeVideoId && (
                 <iframe 
                    width="0" height="0" 
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1&loop=1&playlist=${youtubeVideoId}`} 
                    className="absolute opacity-0 pointer-events-none" 
                 />
             )}
        </div>

        
        {/* Note Panel (Re-integrated) */}
        <AnimatePresence>
            {isNoteOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    className="absolute right-0 top-0 h-full w-[350px] bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 shadow-2xl flex flex-col"
                >
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-white flex items-center gap-2"><StickyNote className="w-4 h-4 text-amber-400" /> Scratchpad</h3>
                         <button onClick={() => setIsNoteOpen(false)}><X className="w-5 h-5 text-white/50 hover:text-white" /></button>
                     </div>
                     <Textarea 
                         value={note} 
                         onChange={e => setNote(e.target.value)}
                         placeholder="Type distractions here..."
                         className="bg-black/30 border-white/10 text-white placeholder:text-white/20 resize-none h-32 focus:ring-purple-500/50"
                         onKeyDown={e => e.ctrlKey && e.key === 'Enter' && addSessionNote()}
                     />
                     <Button onClick={addSessionNote} className="mt-2 w-full bg-white/10 hover:bg-white/20 text-white">Save Note</Button>
                     
                     <div className="flex-1 overflow-y-auto mt-6 space-y-3">
                         {sessionNotes.map(n => (
                             <div key={n.id} className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm text-white/80 relative group">
                                 {n.text}
                                 <button onClick={() => removeSessionNote(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all"><X className="w-3 h-3" /></button>
                             </div>
                         ))}
                     </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

export default Pomodoro;
