"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PresentationHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/rnd/presentation/research");
  }, [router]);
  return null;
}