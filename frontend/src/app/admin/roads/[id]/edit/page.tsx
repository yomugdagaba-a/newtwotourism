"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditRoadPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/roads");
  }, [router]);
  return null;
}
