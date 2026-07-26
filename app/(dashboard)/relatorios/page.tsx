import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, PieChart } from "lucide-react";

export const metadata: Metadata = {
  title: "Relatórios - CG Construções HelpDesk",
  description: "Relatórios e estatísticas de atendimento técnico",
};

export default function RelatoriosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Relatórios"
        breadcrumb={["Início", "Relatórios"]}
        description="Análise de métricas, indicadores de desempenho, tempos de resposta (SLA) e exportação de dados."
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Exportar Excel / PDF
        </Button>
      </PageHeader>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard
          title="Relatório Geral de Atendimento (Estrutura Preparada)"
          description="Evolução mensal por status de resolução"
          headerAction={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="SLA por Prioridade (Estrutura Preparada)"
          description="Aderência aos prazos contratuais de atendimento"
          headerAction={<PieChart className="h-5 w-5 text-muted-foreground" />}
        >
          <div className="space-y-4 pt-4 flex flex-col items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
