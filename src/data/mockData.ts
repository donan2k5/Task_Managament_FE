// src/data/mockData.ts

// Chỉ giữ lại User để hiển thị Avatar/Name
export const currentUser = {
  name: "Nguyen",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
  status: "online" as const,
};

// Các helper function nếu cần dùng lại
export const getTotalWeeklyHours = () => "42.5";
export const getCurrentDayIndex = () => {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
};
