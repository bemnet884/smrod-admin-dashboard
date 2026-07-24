'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import {
  LayoutDashboard, Car, Users, Map, Bell,
  Cpu, Activity, BarChart3, Settings, ShieldCheck,
  History, FileText, Zap, Globe, ShieldAlert, Hospital
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const sidebarGroups = [
  {
    group: "General",
    routes: [
      { label: 'Overview', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'owner', 'manager'] },
    ]
  },
  {
    group: "Operations",
    routes: [
      { label: 'Fleet Management', icon: Car, href: '/dashboard/fleet', roles: ['admin', 'owner', 'manager'] },
      { label: 'Drivers', icon: Users, href: '/dashboard/drivers', roles: ['owner', 'manager'] },
      { label: 'Owners', icon: ShieldCheck, href: '/dashboard/owners', roles: ['admin'] },
      { label: 'Hospitals', icon: Hospital, href: '/dashboard/hospitals', roles: ['admin'] },
    ]
  },
  {
    group: "Monitoring",
    routes: [
      { label: 'Live Tracking', icon: Map, href: '/dashboard/map', roles: ['admin', 'owner', 'manager'] },
      { label: 'Alert Center', icon: Bell, href: '/dashboard/alerts', roles: ['admin', 'owner', 'manager'], badge: true },
      { label: 'Devices', icon: Cpu, href: '/dashboard/devices', roles: ['admin', 'owner'] },
      { label: 'Telemetry Logs', icon: History, href: '/dashboard/logs', roles: ['admin'] },
    ]
  },
  {
    group: "Analytics",
    routes: [
      { label: 'Performance', icon: BarChart3, href: '/dashboard/performance', roles: ['admin', 'owner'] },
      { label: 'Reports', icon: FileText, href: '/dashboard/reports', roles: ['admin', 'owner'] },
    ]
  },
  {
    group: "System",
    routes: [
      { label: 'System Health', icon: Activity, href: '/dashboard/health', roles: ['admin'] },
      { label: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['admin', 'owner', 'manager', 'driver'] },
    ]
  }
];

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() || '';

  return (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 border-r border-slate-800">
      <div className="p-6">
        <div className={cn("flex items-center gap-3 transition-all", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          {!isCollapsed && <span className="font-black tracking-tighter text-white text-xl">SM-ROD <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest ml-1">Command</span></span>}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {sidebarGroups.map((group) => {
          // Check if any route in group is allowed for user
          const allowedRoutes = group.routes.filter(r => r.roles.includes(role));
          if (allowedRoutes.length === 0) return null;

          return (
            <div key={group.group} className="space-y-2">
              {!isCollapsed && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-2">{group.group}</p>}
              <div className="space-y-1">
                {allowedRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                      pathname === route.href ? "bg-emerald-500/10 text-emerald-400 font-bold" : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <route.icon className={cn("w-5 h-5 shrink-0", pathname === route.href ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />
                    {!isCollapsed && <span className="text-sm">{route.label}</span>}
                    {route.badge && !isCollapsed && <div className="absolute right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Indicator */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className={cn("flex items-center gap-3 px-2", isCollapsed && "justify-center")}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {!isCollapsed && <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">34 Devices Live</span>}
        </div>
      </div>
    </div>
  );
}