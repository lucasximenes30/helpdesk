import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Setores - CG Construções HelpDesk",
  description: "Gestão de departamentos, obras e setores organizacionais",
};

export default function SetoresPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Setores"
        breadcrumb={["Início", "Setores"]}
        description="Organização estrutural de departamentos, obras, escritórios e filiais da empresa."
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Setor
        </Button>
      </PageHeader>
      <div className="mt-6">
        <SectionCard
          title="Estrutura de Departamentos e Setores"
          description="Gestão de unidades organizacionais vinculadas aos chamados e usuários."
        >
          <EmptyState
            icon={Building2}
            title="Setores Organizacionais"
            description="Em breve você poderá cadastrar departamentos (ex: Obras, Contabilidade, RH, Engenharia) para direcionamento dos chamados."
            action={
              <Button variant="outline" size="sm">
                Adicionar Primeiro Setor
              </Button>
            }
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
