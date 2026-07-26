"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  UserCheck,
  BarChart3,
  ListTodo,
  AlertTriangle,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { DashboardSkeleton } from "./DashboardSkeleton";

export function OperationalDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    inProgress: 0,
    waiting: 0,
    unassigned: 0,
    resolvedToday: 0,
  });

  const loadOperationalData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets?limit=50&sortBy=createdAt&sortOrder=desc");
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json.tickets || [];
        setTickets(list);

        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const inProg = list.filter((t: any) => t.status === "EM_ATENDIMENTO").length;
        const wait = list.filter(
          (t: any) => t.status === "AGUARDANDO" || t.status === "AGENDADO"
        ).length;
        const unass = list.filter((t: any) => !t.technicianId).length;
        const resToday = list.filter((t: any) => {
          if (t.status !== "CONCLUIDO") return false;
          const closedDate = t.closedAt || t.updatedAt;
          if (!closedDate) return false;
          return closedDate.slice(0, 10) === todayStr;
        }).length;

        setStats({
          inProgress: inProg,
          waiting: wait,
          unassigned: unass,
          resolvedToday: resToday,
        });
      }
    } catch (e) {
      console.error("Erro ao carregar dados do dashboard operacional:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOperationalData();
  }, [loadOperationalData]);

  if (loading && tickets.length === 0) {
    return <DashboardSkeleton />;
  }

  const inProgressTickets = tickets.filter((t) => t.status === "EM_ATENDIMENTO").slice(0, 5);
  const recentTickets = tickets.slice(0, 7);

  function getStatusBadge(status: string) {
    switch (status) {
      case "EM_ATENDIMENTO":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold text-[11px]">
            Em Atendimento
          </Badge>
        );
      case "CONCLUIDO":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold text-[11px]">
            Concluído
          </Badge>
        );
      case "AGUARDANDO":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold text-[11px]">
            Aguardando
          </Badge>
        );
      case "AGENDADO":
        return (
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30 font-semibold text-[11px]">
            Agendado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "CRITICA":
        return <Badge variant="destructive" className="text-[10px]">Crítica</Badge>;
      case "ALTA":
        return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 text-[10px]">Alta</Badge>;
      case "MEDIA":
        return <Badge variant="secondary" className="text-[10px]">Média</Badge>;
      case "BAIXA":
        return <Badge variant="outline" className="text-[10px]">Baixa</Badge>;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO OPERACIONAL (ÁGIL E LEVE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Painel Operacional de Fila de TI
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhamento rápido, chamados em tratativa e atalhos diários da equipe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOperationalData}
            title="Atualizar painel"
            className="h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Link href="/chamados">
            <Button size="sm" className="h-9 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Chamado
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 CARDS DE RESUMO RÁPIDO OPERACIONAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Em Atendimento */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Em Atendimento
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-500">
                {stats.inProgress}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Em tratativa
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chamados abertos com analista atribuído
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Pendências Ativas */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aguardando / Pendentes
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-foreground">
                {stats.waiting}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Pausados
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aguardando fornecedor, peças ou retorno
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Fila Geral (Sem Técnico) */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fila Geral (Sem Técnico)
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-purple-500">
                {stats.unassigned}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Para atribuição
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aguardando analista de TI assumir
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Concluídos Hoje */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Concluídos Hoje
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-500">
                {stats.resolvedToday}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">
                Resolvidos hoje
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Atendimentos finalizados nas últimas 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LINHA DE ATALHOS RÁPIDOS */}
      <div className="bg-muted/20 border border-border/60 rounded-xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Atalhos Rápidos de Operação
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/chamados" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  Abrir Novo Chamado
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/chamados?technicianId=null" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-500">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  Fila Geral Sem Técnico
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/chamados?status=EM_ATENDIMENTO" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  Chamados Em Atendimento
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/relatorios" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-primary text-primary-foreground">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    BI & Relatórios Executivos
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Ver consolidados e PDF
                  </span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-primary" />
            </div>
          </Link>
        </div>
      </div>

      {/* GRADE COM DUAS SEÇÕES OPERACIONAIS: FILA ATIVA EM TRATATIVA + CHAMADOS RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1: CHAMADOS ATUALMENTE EM ATENDIMENTO (1 COLUNA) */}
        <Card className="border-border bg-card shadow-sm lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Fila em Atendimento (Analistas)
            </CardTitle>
            <Link href="/chamados?status=EM_ATENDIMENTO">
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {inProgressTickets.length > 0 ? (
              inProgressTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-primary">
                      #{t.number}
                    </span>
                    {getPriorityBadge(t.priority)}
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {t.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[120px]">
                      👤 {t.technician?.name || "Atribuído"}
                    </span>
                    <span>🏢 {t.sector?.name || "-"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                Nenhum chamado pendente em atendimento no momento.
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLUNA 2 E 3: CHAMADOS RECENTES (2 COLUNAS) */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Chamados Recentes Ingressados
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Últimos chamados abertos e sua situação atual
              </p>
            </div>
            <Link href="/chamados">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Ver Tabela Completa
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase font-bold text-muted-foreground bg-muted/20">
                  <th className="py-2.5 px-4">#ID</th>
                  <th className="py-2.5 px-4">Título / Assunto</th>
                  <th className="py-2.5 px-4">Solicitante</th>
                  <th className="py-2.5 px-4">Setor</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {recentTickets.length > 0 ? (
                  recentTickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold font-mono text-primary">
                        #{t.number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground max-w-[200px] truncate">
                        {t.title}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.requester?.name || t.requesterName || "Solicitante"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.sector?.name || "-"}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/chamados`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold text-primary"
                          >
                            Abrir
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-xs text-muted-foreground"
                    >
                      Nenhum chamado encontrado no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
