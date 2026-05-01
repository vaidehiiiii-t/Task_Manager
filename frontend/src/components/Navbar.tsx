"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, FolderKanban, LogOut, ChevronDown } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  };

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/8">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black group-hover:scale-105 transition-smooth">
              <span className="text-white text-xs font-bold tracking-tight">T</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-black" style={{ letterSpacing: '-0.3px' }}>
              TaskFlow
            </span>
          </Link>

          {/* Center Nav — Pill tabs */}
          <nav className="flex items-center gap-1 bg-[#f5f5f5] rounded-full p-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition-smooth ${
                    active
                      ? "tab-pill-active"
                      : "text-[#666] hover:text-black hover:bg-white"
                  }`}
                  style={{ fontWeight: 480, letterSpacing: '-0.14px' }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2 rounded-full hover:bg-[rgba(0,0,0,0.06)] transition-smooth outline-none">
              <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-medium">
                {initials}
              </div>
              <span className="text-sm text-[#666] hidden sm:block" style={{ fontWeight: 400 }}>{user?.name}</span>
              <ChevronDown className="h-3 w-3 text-[#999]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-black/10 rounded-lg shadow-lg">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-black">{user?.name}</p>
                  <p className="text-xs text-[#666] truncate">{user?.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-black/8" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#666] hover:text-black">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
