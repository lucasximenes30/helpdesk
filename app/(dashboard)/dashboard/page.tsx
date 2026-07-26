import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { DashboardSkeleton } from "@/modules/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - CG Construções HelpDesk",
  description: "Visão geral e indicadores do sistema HelpDesk Pro",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        breadcrumb={["Início", "Dashboard"]}
        description="Acompanhe a estrutura inicial do painel de controle. Os indicadores serão ativados nas próximas etapas."
      >
        <Button variant="outline" size="sm">
          Exportar Estrutura
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Chamado
        </Button>
      </PageHeader>
      <div className="mt-6">
        <DashboardSkeleton />
      </div>
    </PageContainer>
  );
}
