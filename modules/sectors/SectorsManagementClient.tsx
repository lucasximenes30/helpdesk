"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { SectorModal } from "./SectorModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export interface SectorRow {
  id: string;
  name: string;
  description: string | null;
}

export function SectorsManagementClient() {
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sectorToEdit, setSectorToEdit] = useState<SectorRow | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<SectorRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSectors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sectors");
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
        setFilteredSectors(data);
      }
    } catch (err) {
      console.error("Erro ao buscar setores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredSectors(sectors);
    } else {
      const term = search.toLowerCase();
      setFilteredSectors(
        sectors.filter((s) => s.name.toLowerCase().includes(term))
      );
    }
  }, [search, sectors]);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sectors/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir setor");
      setConfirmDelete(null);
      fetchSectors();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir setor");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<SectorRow>[] = [
    {
      key: "name",
      label: "Nome do Setor",
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "description",
      label: "Descrição",
      render: (s) => (
        <span className="text-slate-500">
          {s.description || <span className="italic">Sem descrição</span>}
        </span>
      ),
    },
    {
      key: "id",
      label: "",
      render: (s) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSectorToEdit(s);
                  setIsModalOpen(true);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDelete(s)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
        title="Setores"
        breadcrumb={["Início", "Setores"]}
        description="Gestão de departamentos e empresas cadastradas no sistema."
      >
        <Button
          onClick={() => {
            setSectorToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </PageHeader>

      <div className="mt-6">
        <SectionCard>
          <div className="flex mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar setores..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredSectors}
            isLoading={loading}
            emptyTitle="Nenhum setor encontrado"
            emptyDescription="Crie o seu primeiro setor clicando no botão acima."
          />
        </SectionCard>
      </div>

      <SectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSectors}
        sectorToEdit={sectorToEdit}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Excluir Setor"
        description={`Tem certeza que deseja excluir o setor ${confirmDelete?.name}? Ele não poderá ser recuperado.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        variant="destructive"
      />
    </>
  );
}
