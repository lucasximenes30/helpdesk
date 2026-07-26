import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Solicitantes - CG Construções HelpDesk",
  description: "Cadastro de solicitantes e clientes do atendimento",
};

interface RequesterPlaceholder {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
}

const columns: Column<RequesterPlaceholder>[] = [
  { key: "name", label: "Nome do Solicitante" },
  { key: "email", label: "E-mail de Contato" },
  { key: "company", label: "Empresa / Setor" },
  { key: "phone", label: "Telefone" },
];

export default function SolicitantesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Solicitantes"
        breadcrumb={["Início", "Solicitantes"]}
        description="Cadastro e histórico de solicitantes, colaboradores e clientes atendidos pelo suporte."
      >
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Solicitante
        </Button>
      </PageHeader>
      <div className="mt-6">
        <SectionCard
          title="Base de Solicitantes e Clientes"
          description="Gestão de contatos autorizados a solicitar suporte técnico."
        >
          <DataTable
            columns={columns}
            data={[]}
            emptyTitle="Nenhum solicitante cadastrado"
            emptyDescription="A tabela está estruturada e pronta para receber o histórico de solicitantes do sistema."
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
