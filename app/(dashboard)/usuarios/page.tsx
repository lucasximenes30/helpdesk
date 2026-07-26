import React from "react";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Usuários - CG Construções HelpDesk",
  description: "Gestão de técnicos, administradores e papéis RBAC",
};

interface UserPlaceholder {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const columns: Column<UserPlaceholder>[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "role", label: "Papel (RBAC)" },
  { key: "department", label: "Setor / Departamento" },
];

export default function UsuariosPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Usuários"
        breadcrumb={["Início", "Usuários"]}
        description="Gestão de técnicos, administradores e controle de papéis (ADMIN, TI, SOLICITANTE)."
      >
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-1" />
          Papéis RBAC
        </Button>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Novo Usuário
        </Button>
      </PageHeader>
      <div className="mt-6">
        <SectionCard
          title="Listagem de Usuários do Sistema"
          description="A estrutura para gestão de técnicos e administradores está pronta para o desenvolvimento dos cadastros."
        >
          <DataTable
            columns={columns}
            data={[]}
            emptyTitle="Nenhum usuário adicional listado"
            emptyDescription="O primeiro ADMIN já foi inicializado pelo .env. Em etapas futuras, o gerenciamento de usuários será implementado aqui."
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
