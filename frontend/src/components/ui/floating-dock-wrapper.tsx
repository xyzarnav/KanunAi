"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconHome,
  IconUserFilled,
  IconLogin,
  IconLogout,
  IconMessages,
  IconFileDescription,
  IconScale,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function FloatingDockWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Hide on login and signup only
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  const baseItems = [
    {
      title: "Home",
      icon: <IconHome className="text-neutral-200" />,
      href: "/",
    },
    {
      title: isAuthenticated ? `Profile (${user?.name ?? ""})` : "Login",
      icon: isAuthenticated ? (
        <IconUserFilled className="text-neutral-200" />
      ) : (
        <IconLogin className="text-neutral-200" />
      ),
      href: isAuthenticated ? "/profile" : "/login",
    },
    ...(isAuthenticated
      ? [
          {
            title: "Logout",
            icon: <IconLogout className="text-red-400" />,
            href: "#",
            onClick: () => {
              logout();
              router.push("/");
            },
          },
        ]
      : []),
  ];

  let items = baseItems;

  // Route-specific items for case-analysis
  if (pathname?.startsWith("/case-analysis")) {
    items = [
      { title: "Home", icon: <IconHome className="text-neutral-200" />, href: "/" },
      { title: "Profile", icon: <IconUserFilled className="text-neutral-200" />, href: "/profile" },
      ...(isAuthenticated
        ? [
            {
              title: "Logout",
              icon: <IconLogout className="text-red-400" />,
              href: "#",
              onClick: () => {
                logout();
                router.push("/");
              },
            },
          ]
        : [{ title: "Login", icon: <IconLogin className="text-neutral-200" />, href: "/login" }]),
      { title: "Chatbot", icon: <IconMessages className="text-neutral-200" />, href: "/chatbot" },
      { title: "Files", icon: <IconFileDescription className="text-neutral-200" />, href: "/files" },
      { title: "Analysis", icon: <IconScale className="text-neutral-200" />, href: "/case-analysis" },
    ];
  }
  if (pathname === "/") {
    items = [
      
      {
        title: "Case Analysis",
        icon: <IconScale className="text-neutral-200" />,
        href: "/case-analysis",
      },
      ...baseItems,
    ];
  }

  return (
    <FloatingDock
      items={items}
      desktopClassName="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900"
      mobileClassName="fixed top-8 right-4 z-50"
    />
  );
}


