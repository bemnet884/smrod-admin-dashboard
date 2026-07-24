'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { canAccess } from '@/lib/rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!canAccess(user?.role, allowedRoles)) {
    return null; // Show nothing if unauthorized
  }

  return <>{children}</>;
}