import {
  Briefcase,
  Home,
  Heart,
  Star,
  Folder,
  BookOpen,
  Code,
  Music,
  Dumbbell,
  ShoppingBag,
  Plane,
  Coffee,
  Lightbulb,
  Gamepad2,
  Camera,
  Palette,
  LucideIcon,
} from "lucide-react";

export interface ProjectIconConfig {
  id: string;
  icon: LucideIcon;
  label: string;
}

export const PROJECT_ICONS: ProjectIconConfig[] = [
  { id: "briefcase", icon: Briefcase, label: "Work" },
  { id: "home", icon: Home, label: "Home" },
  { id: "heart", icon: Heart, label: "Health" },
  { id: "star", icon: Star, label: "Important" },
  { id: "folder", icon: Folder, label: "General" },
  { id: "book", icon: BookOpen, label: "Study" },
  { id: "code", icon: Code, label: "Dev" },
  { id: "music", icon: Music, label: "Music" },
  { id: "dumbbell", icon: Dumbbell, label: "Fitness" },
  { id: "shopping", icon: ShoppingBag, label: "Shopping" },
  { id: "plane", icon: Plane, label: "Travel" },
  { id: "coffee", icon: Coffee, label: "Break" },
  { id: "lightbulb", icon: Lightbulb, label: "Ideas" },
  { id: "gamepad", icon: Gamepad2, label: "Games" },
  { id: "camera", icon: Camera, label: "Photos" },
  { id: "palette", icon: Palette, label: "Design" },
];

export const getProjectIcon = (iconId?: string): LucideIcon => {
  if (!iconId) return Folder;
  const found = PROJECT_ICONS.find(p => p.id === iconId);
  return found?.icon || Folder;
};

export const getProjectIconById = (iconId?: string): ProjectIconConfig | undefined => {
  return PROJECT_ICONS.find(p => p.id === iconId);
};
