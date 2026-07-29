"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Edit3,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { UserModal } from "../users/UserModal";
import { UserPasswordModal } from "../users/UserPasswordModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { UserRow } from "../users/UsersManagementClient";

export function RequestersManagementClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros, pesquisa e paginação
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Controle de Modais
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserRow | null>(null);

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passUser, setPassUser] = useState<UserRow | null>(null);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
        role: "SOLICITANTE" // Filtro fixo para solicitantes
      });
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar solicitantes:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Ações rápidas
  const handleToggleStatus = async (u: UserRow) => {
    try {
      const res = await fetch(`/api/users/${u.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${confirmDeleteUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir solicitante");
      setConfirmDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir solicitante");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "Solicitante",
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
          <span className="text-xs text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      key: "sector",
      label: "Empresa / Setor",
      render: (u) => (
        <span className="text-sm">
          {u.sector?.name || <span className="text-slate-400 italic">Não vinculado</span>}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (u) => (
        <Badge
          variant="outline"
          className={
            u.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }
        >
          {u.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "",
      render: (u) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setUserToEdit(u);
                  setIsUserModalOpen(true);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Editar Cadastro
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setPassUser(u);
                  setIsPassModalOpen(true);
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" /> Redefinir Senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                {u.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">Desativar Acesso</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Reativar Acesso</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDeleteUser(u)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Solicitante
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Solicitantes"
        breadcrumb={["Início", "Solicitantes"]}
        description="Gestão de contatos autorizados a solicitar suporte técnico."
      >
        <Button
          onClick={() => {
            setUserToEdit(null);
            setIsUserModalOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Solicitante
        </Button>
      </PageHeader>

      <div className="mt-6">
        <SectionCard>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos</option>
              </select>
              <Button variant="outline" size="icon" onClick={() => fetchUsers()}>
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={users}
            isLoading={loading}
            emptyTitle="Nenhum solicitante encontrado"
            emptyDescription="Tente ajustar os filtros ou adicione um novo solicitante."
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <span className="text-sm text-slate-500">
                Mostrando página {page} de {totalPages} ({totalRecords} registros)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={fetchUsers}
        userToEdit={userToEdit}
      />

      <UserPasswordModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        userId={passUser?.id || null}
        userName={passUser?.name || ""}
      />

      <ConfirmDialog
        open={!!confirmDeleteUser}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteUser(null);
        }}
        title="Excluir Solicitante"
        description={`Tem certeza que deseja excluir o solicitante ${confirmDeleteUser?.name}? Esta ação o impedirá de acessar o sistema e abrir chamados.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        variant="destructive"
      />
    </>
  );
}
