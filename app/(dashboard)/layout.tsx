'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { MobileSidebar } from '@/components/shared/mobile-sidebar';
import { UserNav } from '@/components/shared/user-nav';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSidebarStore } from '@/store/useSidebarStore';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch on initial load
  useEffect(() => setIsMounted(true), []);

  const sidebarWidth = isMounted && isCollapsed ? 'md:w-20' : 'md:w-72';
  const mainPadding = isMounted && isCollapsed ? 'md:pl-20' : 'md:pl-72';

  return (
    <div className="h-full relative transition-all duration-300">

      {/* --- DESKTOP SIDEBAR --- */}
      <div className={cn(
        "hidden md:flex h-full md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300 ease-in-out",
        sidebarWidth
      )}>
        <Sidebar isCollapsed={isMounted && isCollapsed} />
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={cn("h-full flex flex-col transition-all duration-300 ease-in-out", mainPadding)}>

        {/* TOP HEADER */}
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-8 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-4">

            {/* Mobile Hamburger Menu */}
            <MobileSidebar />

            {/* Desktop Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={toggleSidebar}
            >
              {isMounted && isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>

            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest hidden sm:block">
              Security Monitoring Platform
            </h2>
          </div>

          <div className="flex items-center gap-x-4">
            <UserNav />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto bg-slate-50/30">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
      </main>
    </div>
  );
}