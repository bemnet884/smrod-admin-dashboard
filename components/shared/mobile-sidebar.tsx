'use client';

import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/shared/sidebar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close the sidebar when the route changes (user clicked a link)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fix hydration mismatch by ensuring this only renders on client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>

      {/* Accessibility primitives for screen readers */}
      <div className="sr-only">
        <SheetTitle>Navigation Menu</SheetTitle>
        <SheetDescription>Main navigation sidebar</SheetDescription>
      </div>

      {/* p-0 to remove default padding so the sidebar fills the space */}
      <SheetContent side="left" className="p-0 bg-[#111827] border-r-gray-800 w-72">
        <Sidebar isCollapsed={false} />
      </SheetContent>
    </Sheet>
  );
}