"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { NAVIGATION_ITEMS } from "@/config/navigation.config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();
  const { config } = useWhiteLabel();

  const renderNavItems = () => (
    <nav className="flex-1 space-y-1.5 p-3">
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={isCollapsed ? item.title : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )}
            />
            {!isCollapsed && (
              <span className="truncate font-medium">{item.title}</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-md group-hover:block z-50 whitespace-nowrap">
                {item.title}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Off-canvas background overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar para desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300 ease-in-out relative shrink-0",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* White Label Logo Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4 transition-all",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-1.5">
              <Image
                src={config.logo}
                alt={config.systemName}
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-bold tracking-tight text-foreground truncate">
                  {config.systemName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  White Label Ready
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navegação Principal */}
        {renderNavItems()}

        {/* Toggle Button no Rodapé do Sidebar */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center gap-2 justify-center text-muted-foreground hover:text-foreground",
              !isCollapsed && "justify-start px-3"
            )}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs font-semibold">Recolher</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar-background transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-1.5">
              <Image
                src={config.logo}
                alt={config.systemName}
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-base font-bold tracking-tight text-foreground truncate">
                {config.systemName}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                White Label Ready
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {renderNavItems()}
      </aside>
    </>
  );
}
