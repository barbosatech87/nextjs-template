"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SafeRedirectProps {
  href: string;
}

export default function SafeRedirect({ href }: SafeRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}