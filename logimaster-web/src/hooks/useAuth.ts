"use client";

import { useMemo } from "react";
import { can, Role, Resource, Action } from "@/lib/permissions";

interface StoredUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
  employeeId?: string | null;
  token: string;
}

export function useAuth() {
  const user = useMemo<StoredUser | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const s = localStorage.getItem("logimaster_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }, []);

  const role: Role = user?.role ?? "Viewer";

  return {
    user,
    role,
    isAdmin: role === "Administrator",
    can: (resource: Resource, action: Action) => can(role, resource, action),
  };
}
