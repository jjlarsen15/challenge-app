import {
  BookOpen,
  CheckSquare,
  Home,
  MessageSquareText,
  Mic,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/capture", label: "Capture", icon: Mic },
  { href: "/memory", label: "Memory", icon: BookOpen },
  { href: "/review", label: "Review", icon: CheckSquare, badge: true },
  { href: "/ask", label: "Ask", icon: MessageSquareText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MOBILE_PRIMARY = ["/overview", "/capture", "/memory", "/ask"] as const;
