import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Serviços - CG Construções HelpDesk",
  description: "Catálogo de serviços e categorias de atendimento",
};

export default function ServicosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Serviços"
        breadcrumb={["Início", "Serviços"]}
        description="Catálogo de serviços, categorias de atendimento técnico e prazos de SLA."
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Serviço
        </Button>
      </PageHeader>
      <div className="mt-6">
        <SectionCard
          title="Catálogo de Serviços Disponíveis"
          description="Estrutura de serviços e especialidades para classificação de chamados."
        >
          <EmptyState
            icon={Layers}
            title="Catálogo de Serviços em Preparação"
            description="Neste módulo será possível configurar as categorias de atendimento (Hardware, Software, Infraestrutura, Obras) para os chamados."
            action={
              <Button variant="outline" size="sm">
                Configurar Catálogo Futuro
              </Button>
            }
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
