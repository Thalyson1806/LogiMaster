"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogisticsSidebar from "@/components/LogisticsSidebar";

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("logimaster_user");
    if (!s) {
      router.replace("/login");
    } else {
      try {
        const u = JSON.parse(s);
        if (!u?.token) router.replace("/login");
        else setChecked(true);
      } catch {
        router.replace("/login");
      }
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LogisticsSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
