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

import { useState } from "react";

// Helper to show a floating popup near the dock
function FloatingPopup({ show, message }: Readonly<{ show: boolean; message: string }>) {
  if (!show) return null;
  return (
    <div className="fixed left-1/2 top-36 z-[100] -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg border border-yellow-700 animate-fade-in">
      {message}
    </div>
  );
}

export default function FloatingDockWrapper() {
  // State for chat popup (must be before any return)
  const [showChatPopup, setShowChatPopup] = useState(false);
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

  // Only for /case-analysis, override Chatbot icon behavior
  if (pathname?.startsWith("/case-analysis")) {
    // Remove href for Chatbot, use onClick
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
      {
        title: "Chatbot",
        icon: <IconMessages className="text-neutral-200" />,
        href: "#",
        onClick: () => {
          // Try to trigger a custom event for chat open
          const event = new CustomEvent("open-case-chatbot");
          window.dispatchEvent(event);
          // If not ready, show popup
          setShowChatPopup(true);
          setTimeout(() => setShowChatPopup(false), 2200);
        },
      },
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
    <>
      <FloatingDock
        items={items}
        desktopClassName="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900"
        mobileClassName="fixed top-8 right-4 z-50"
      />
      {pathname?.startsWith("/case-analysis") && (
        <FloatingPopup show={showChatPopup} message="Please analyse the doc first" />
      )}
    </>
  );
}


