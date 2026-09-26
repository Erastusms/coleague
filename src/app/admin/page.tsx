import { Metadata } from "next";
import { AdminLoginView } from "@/components/AdminLoginView";

export const metadata: Metadata = {
  title: "Admin Portal | Coleague",
  description: "Dedicated administrative portal for Coleague and ESPN API synchronization.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminLoginView />;
}
