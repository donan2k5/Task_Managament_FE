import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto w-full h-full relative p-0">{children}</main>
    </div>
  );
};

export default DashboardLayout;
