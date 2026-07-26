"use client";

import React from "react";
import Image from "next/image";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Palette, Building, Save } from "lucide-react";

export default function ConfiguracoesPage() {
  const { config } = useWhiteLabel();

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        breadcrumb={["Início", "Configurações"]}
        description="Configurações gerais do sistema, personalização White Label (CG Construções) e estrutura RBAC."
      >
        <Button size="sm">
          <Save className="h-4 w-4 mr-1" />
          Salvar Alterações
        </Button>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* White Label Preview Card */}
        <SectionCard
          title="Personalização White Label (Empresa Cliente)"
          description="Aparência do sistema configurada com a identidade visual da empresa cliente."
          headerAction={
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Palette className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-card p-2 shadow-sm border border-border">
                <Image
                  src={config.logo}
                  alt={config.systemName}
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {config.systemName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Logo padrão: <code className="text-primary font-mono">{config.logo}</code>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome do Sistema
                </label>
                <Input defaultValue={config.systemName} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cor Primária (CSS Var)
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <Input defaultValue={config.primaryColor} disabled className="font-mono text-xs" />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-1">
              * Na etapa atual os valores estão definidos no arquivo de configuração (White Label Ready). Posteriormente serão lidos diretamente do banco PostgreSQL (Neon).
            </p>
          </div>
        </SectionCard>

        {/* RBAC Structure Preview */}
        <SectionCard
          title="Estrutura de Papéis (RBAC)"
          description="Controle de acessos baseado em papéis de usuário (Role-Based Access Control)."
          headerAction={
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              <Shield className="h-3 w-3 mr-1" />
              Estrutura Preparada
            </Badge>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">ADMIN</span>
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Acesso Total</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Administrador com acesso irrestrito a configurações, usuários e todos os chamados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">TI</span>
                  <Badge className="bg-blue-600 text-white text-[10px]">Técnico / Suporte</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Técnico de suporte responsável por atender, classificar e resolver os chamados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">SOLICITANTE</span>
                  <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px]">
                    Usuário Padrão
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuário ou cliente que abre solicitações de atendimento e acompanha seus tickets.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
