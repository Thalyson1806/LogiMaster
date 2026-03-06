import LogisticsSidebar from "@/components/LogisticsSidebar";
import React from "react";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <LogisticsSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
