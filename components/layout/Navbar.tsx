"use client";

import React from "react";
import { Menu, Search, ShieldCheck } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { toggleMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleMobile}
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Busca Rápida */}
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar chamados, usuários, serviços..."
            className="w-full rounded-full pl-9 pr-4 bg-muted/40 focus:bg-background border-border/80"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge de Status Operacional */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sistema Operacional</span>
          </Badge>
        </div>

        {/* Alternador de Temas (Claro, Escuro e Automático) */}
        <ThemeToggle />

        {/* Menu do Usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
