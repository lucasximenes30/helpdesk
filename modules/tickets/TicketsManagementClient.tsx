"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  UserCheck,
  CheckCircle2,
  Archive,
  Trash2,
  Copy,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { TicketModal } from "./TicketModal";
import { AssignTechnicianModal, ChangeStatusModal } from "./QuickActionModals";
import { MonthYearSelector } from "@/components/common/MonthYearSelector";

export interface TicketRow {
  id: string;
  ticketNumber: number;
  ticketMonthYear?: string;
  problem: string;
  description: string | null;
  status: string;
  origin: string;
  priority: string;
  ticketDate: string;
  startTime: string | null;
  endTime: string | null;
  totalTimeMinutes: number | null;
  isArchived: boolean;
  requester: { id: string; name: string; email: string; department?: string | null };
  sector: { id: string; name: string };
  technician?: { id: string; name: string; email: string; avatar?: string | null } | null;
  service: { id: string; name: string; category?: string | null };
  _count?: { comments: number; history: number };
}

export function TicketsManagementClient() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Auxiliares (Setores, Serviços e Técnicos)
  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; category?: string | null }>>([]);
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Filters & Search
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [technicianFilter, setTechnicianFilter] = useState<string>("ALL");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [isArchived, setIsArchived] = useState(false);
  const [monthYear, setMonthYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<"ticketDate" | "totalTimeMinutes" | "requester" | "service">("ticketDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Quick action modals
  const [assignTechModalOpen, setAssignTechModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null);

  // Confirm delete / archive
  const [confirmDelete, setConfirmDelete] = useState<TicketRow | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<TicketRow | null>(null);

  // KPIs calculados com base na listagem
  const totalInAttendance = tickets.filter((t) => t.status === "EM_ATENDIMENTO").length;
  const totalCompleted = tickets.filter((t) => t.status === "CONCLUIDO").length;
  const totalWaiting = tickets.filter((t) => t.status === "AGUARDANDO").length;

  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [secRes, srvRes, techRes] = await Promise.all([
        fetch("/api/sectors"),
        fetch("/api/services"),
        fetch("/api/users?role=ADMIN_OR_TI&limit=100"),
      ]);

      if (secRes.ok) {
        const data = await secRes.json();
        setSectors(data || []);
      }
      if (srvRes.ok) {
        const data = await srvRes.json();
        setServices(data || []);
      }
      if (techRes.ok) {
        const data = await techRes.json();
        const tiUsers = (Array.isArray(data) ? data : data.users || data.data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        }));
        setTechnicians(tiUsers);
      }
    } catch (err) {
      console.error("Erro ao carregar dados auxiliares de chamados:", err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (query.trim()) params.set("query", query.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sectorFilter !== "ALL") params.set("sectorId", sectorFilter);
      if (serviceFilter !== "ALL") params.set("serviceId", serviceFilter);
      if (technicianFilter !== "ALL") params.set("technicianId", technicianFilter);
      if (originFilter !== "ALL") params.set("origin", originFilter);
      params.set("isArchived", String(isArchived));
      if (monthYear) params.set("monthYear", monthYear);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const body = await res.json();
        setTickets(body.data || []);
        setTotalPages(body.meta?.totalPages || 1);
        setTotalItems(body.meta?.total || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar chamados:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    query,
    statusFilter,
    sectorFilter,
    serviceFilter,
    technicianFilter,
    originFilter,
    isArchived,
    monthYear,
  ]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Formatar duração (12 min, 1 h 20 min)
  function formatTimeBadge(minutes: number | null): string {
    if (minutes === null || minutes === undefined || minutes < 0) return "Em and.";
    if (minutes === 0) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  // Rótulo de Status (Minimalista Linear-like)
  function renderStatusBadge(status: string) {
    switch (status) {
      case "EM_ATENDIMENTO":
        return (
          <Badge className="bg-transparent text-amber-500 border-amber-500/20 hover:bg-amber-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" /> Em Atendimento
          </Badge>
        );
      case "CONCLUIDO":
        return (
          <Badge className="bg-transparent text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> Concluído
          </Badge>
        );
      case "AGUARDANDO":
        return (
          <Badge className="bg-transparent text-blue-500 border-blue-500/20 hover:bg-blue-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" /> Aguardando
          </Badge>
        );
      case "AGENDADO":
        return (
          <Badge className="bg-transparent text-purple-500 border-purple-500/20 hover:bg-purple-500/10 text-[11px] px-2 py-0.5 font-medium shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" /> Agendado
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[11px] shadow-none">{status}</Badge>;
    }
  }

  // Quick assign technician
  async function handleSaveTechnician(technicianId: string | null) {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      if (!res.ok) throw new Error("Erro ao atribuir técnico");
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Erro ao atribuir técnico");
    }
  }

  // Quick change status
  async function handleSaveStatus(newStatus: string) {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao alterar status");
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status");
    }
  }

  // Duplicate ticket
  async function handleDuplicateTicket(t: TicketRow) {
    try {
      const res = await fetch(`/api/tickets/${t.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao duplicar chamado");
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Erro ao duplicar chamado");
    }
  }

  // Archive ticket
  async function handleArchiveConfirm() {
    if (!confirmArchive) return;
    try {
      const res = await fetch(`/api/tickets/${confirmArchive.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !confirmArchive.isArchived }),
      });
      if (!res.ok) throw new Error("Erro ao arquivar chamado");
      setConfirmArchive(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Erro ao arquivar chamado");
    }
  }

  // Soft Delete
  async function handleDeleteConfirm() {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/tickets/${confirmDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir chamado");
      setConfirmDelete(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir chamado");
    }
  }

  const columns: Column<TicketRow>[] = [
    {
      label: "Número",
      key: "ticketNumber",
      className: "w-20 text-center font-mono",
      render: (item) => (
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono text-muted-foreground border border-border/50 bg-transparent">
          {item.ticketNumber}{item.ticketMonthYear ? `/${item.ticketMonthYear.split('-')[0]}` : ""}
        </span>
      ),
    },
    {
      label: "Solicitante & Setor",
      key: "requester",
      className: "max-w-[220px]",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs truncate">
            {item.requester?.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
              {item.sector?.name}
            </Badge>
            {item.requester?.department && (
              <span className="text-[10px] text-muted-foreground truncate">
                {item.requester.department}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Serviço & Problema",
      key: "problem",
      className: "max-w-[280px]",
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-primary truncate">
              [{item.service?.name}]
            </span>
          </div>
          <span className="text-xs font-medium text-foreground truncate mt-0.5">
            {item.problem}
          </span>
          {item.description && (
            <span className="text-[10px] text-muted-foreground truncate">
              {item.description}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Técnico Responsável",
      key: "technician",
      className: "w-40",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.technician ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {item.technician.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate">{item.technician.name}</span>
            </>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
              Fila Geral
            </Badge>
          )}
        </div>
      ),
    },
    {
      label: "Tempo Total",
      key: "totalTimeMinutes",
      className: "w-24 text-center font-mono",
      render: (item) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 text-muted-foreground">
          <Clock className="w-3 h-3 opacity-50" />
          {formatTimeBadge(item.totalTimeMinutes)}
        </span>
      ),
    },
    {
      label: "Status",
      key: "status",
      className: "w-32 text-center",
      render: (item) => renderStatusBadge(item.status),
    },
    {
      label: "Origem",
      key: "origin",
      className: "w-20 text-center",
      render: (item) => (
        <Badge variant="outline" className="text-[10px] font-mono">
          {item.origin}
        </Badge>
      ),
    },
    {
      label: "Ações",
      key: "id",
      className: "w-16 text-right",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setSelectedTicketId(item.id);
                setModalOpen(true);
              }}
              className="text-xs gap-2"
            >
              <Edit className="w-3.5 h-3.5 text-primary" />
              Ver / Editar Chamado
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActiveTicket(item);
                setAssignTechModalOpen(true);
              }}
              className="text-xs gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              Atribuir Técnico...
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActiveTicket(item);
                setStatusModalOpen(true);
              }}
              className="text-xs gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Alterar Status...
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDuplicateTicket(item)}
              className="text-xs gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-purple-500" />
              Duplicar Chamado
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setConfirmArchive(item)}
              className="text-xs gap-2"
            >
              <Archive className="w-3.5 h-3.5 text-amber-500" />
              {item.isArchived ? "Restaurar Chamado" : "Arquivar Chamado"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDelete(item)}
              className="text-xs gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir (Soft Delete)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho Minimalista */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Chamados
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Gestão inteligente de tickets e SLA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsArchived(!isArchived);
              setPage(1);
            }}
            className="text-xs"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {isArchived ? "Exibindo Arquivados" : "Ver Arquivados"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedTicketId(null);
              setModalOpen(true);
            }}
            className="text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* Cards de KPIs (Slim) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/40 bg-transparent shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground">
                Total Listado
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">
                {totalItems}
              </p>
            </div>
            <FileText className="w-8 h-8 text-primary/40" />
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-transparent shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-amber-500">
                Em Atendimento
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">
                {totalInAttendance}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-500/40" />
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-transparent shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-emerald-500">
                Concluídos
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">
                {totalCompleted}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-transparent shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-blue-500">
                Aguardando
              </p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">
                {totalWaiting}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa, Filtros Rápidos e Ordenação */}
      <Card className="border border-border/80 bg-card/40">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Mês de Referência:</span>
              <MonthYearSelector
                value={monthYear || "ALL"}
                onChange={(my) => {
                  setMonthYear(my === "ALL" ? "" : my);
                  setPage(1);
                }}
                includeAllYear={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Campo Pesquisa Combinada */}
            <div className="md:col-span-2 relative">
              <Input
                placeholder="Pesquisar número, solicitante, problema..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 text-xs h-9"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5" />
            </div>

            {/* Filtro Status */}
            <div>
              <select
                className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Status: Todos</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="AGENDADO">Agendado</option>
              </select>
            </div>

            {/* Filtro Setor */}
            <div>
              <select
                className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Setor: Todos</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Técnico */}
            <div>
              <select
                className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                value={technicianFilter}
                onChange={(e) => {
                  setTechnicianFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">Técnico: Todos</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <select
                className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [b, o] = e.target.value.split(":") as [any, any];
                  setSortBy(b);
                  setSortOrder(o);
                }}
              >
                <option value="ticketDate:desc">Data (Mais recentes)</option>
                <option value="ticketDate:asc">Data (Mais antigos)</option>
                <option value="totalTimeMinutes:desc">Tempo (Maior duração)</option>
                <option value="totalTimeMinutes:asc">Tempo (Menor duração)</option>
                <option value="requester:asc">Solicitante (A-Z)</option>
                <option value="service:asc">Serviço (A-Z)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Chamados */}
      <Card className="border border-border/80 bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={tickets}
          isLoading={loading}
          emptyTitle="Nenhum chamado encontrado"
          emptyDescription="Cadastre um novo chamado para substituir a planilha de TI ou limpe os filtros selecionados."
        />
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Página <strong className="text-foreground">{page}</strong> de{" "}
              <strong className="text-foreground">{totalPages}</strong> (Total:{" "}
              {totalItems} itens)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs h-7"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs h-7"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modais do Módulo */}
      <TicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ticketId={selectedTicketId}
        sectors={sectors}
        services={services}
        technicians={technicians}
        onSaved={fetchTickets}
      />

      <AssignTechnicianModal
        open={assignTechModalOpen}
        onOpenChange={setAssignTechModalOpen}
        ticketNumber={activeTicket?.ticketNumber}
        currentTechnicianId={activeTicket?.technician?.id}
        technicians={technicians}
        onSave={handleSaveTechnician}
      />

      <ChangeStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        ticketNumber={activeTicket?.ticketNumber}
        currentStatus={activeTicket?.status || "EM_ATENDIMENTO"}
        onSave={handleSaveStatus}
      />

      <ConfirmDialog
        open={Boolean(confirmArchive)}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
        title={confirmArchive?.isArchived ? "Restaurar Chamado?" : "Arquivar Chamado?"}
        description={`Deseja realmente ${
          confirmArchive?.isArchived ? "restaurar" : "arquivar"
        } o chamado #${confirmArchive?.ticketNumber} (${confirmArchive?.problem})?`}
        confirmLabel={confirmArchive?.isArchived ? "Sim, Restaurar" : "Sim, Arquivar"}
        cancelLabel="Cancelar"
        onConfirm={handleArchiveConfirm}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Excluir Chamado (Soft Delete)?"
        description={`Deseja inativar logicamente o chamado #${confirmDelete?.ticketNumber}? O histórico de auditoria será mantido.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
