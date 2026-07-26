import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Chamados - CG Construções HelpDesk",
  description: "Gestão e atendimento de chamados e solicitações",
};

interface TicketPlaceholder {
  id: string;
  title: string;
  status: string;
  priority: string;
  requester: string;
}

const columns: Column<TicketPlaceholder>[] = [
  { key: "id", label: "Código" },
  { key: "title", label: "Título do Chamado" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Prioridade" },
  { key: "requester", label: "Solicitante" },
];

export default function ChamadosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Chamados"
        breadcrumb={["Início", "Chamados"]}
        description="Gestão completa de tickets, incidentes e solicitações de suporte."
      >
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-1" />
          Filtros
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Abrir Chamado
        </Button>
      </PageHeader>
      <div className="mt-6">
        <SectionCard
          title="Tabela de Chamados (Pronta para Evolução)"
          description="A funcionalidade e listagem de chamados serão conectadas ao banco na próxima etapa."
        >
          <DataTable
            columns={columns}
            data={[]}
            emptyTitle="Nenhum chamado aberto"
            emptyDescription="A estrutura da tabela está pronta. Na próxima etapa os chamados serão listados aqui."
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
