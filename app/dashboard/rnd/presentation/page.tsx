"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PresentationHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/rnd/presentation/research");
  }, [router]);
  return null;
}