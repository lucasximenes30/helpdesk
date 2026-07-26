import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { OperationalDashboardClient } from "@/modules/dashboard/OperationalDashboardClient";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard Operacional — CG Construções HelpDesk",
  description: "Central operacional de chamados, fila em atendimento e atividades de TI em tempo real",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Operacional"
        breadcrumb={["Início", "Dashboard"]}
        description="Acompanhe o fluxo diário de atendimentos, chamados em tratativa e atalhos rápidos da equipe de TI."
      >
        <Link href="/relatorios">
          <Button variant="outline" size="sm" className="font-semibold mr-2">
            <BarChart3 className="h-4 w-4 mr-1.5 text-primary" />
            Relatórios C-Level & BI
          </Button>
        </Link>
        <Link href="/chamados">
          <Button size="sm" className="font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            Abrir Novo Chamado
          </Button>
        </Link>
      </PageHeader>

      <div className="mt-6">
        <OperationalDashboardClient />
      </div>
    </PageContainer>
  );
}
