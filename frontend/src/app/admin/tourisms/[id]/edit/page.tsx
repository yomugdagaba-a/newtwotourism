"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditTourismPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/tourisms");
  }, [router]);
  return null;
}
