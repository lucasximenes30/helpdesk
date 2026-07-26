"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  RefreshCw,
  Settings2,
  Printer,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Layers,
  Building2,
  Download,
  Filter,
  BarChart3,
} from "lucide-react";
import { DashboardSkeleton } from "@/modules/dashboard/DashboardSkeleton";
import { ChartWidget, ChartType } from "@/modules/dashboard/charts/ChartWidgets";
import {
  WidgetConfigModal,
  DashboardWidgetConfig,
  INITIAL_WIDGETS_CONFIG,
} from "@/modules/dashboard/WidgetConfigModal";
import {
  ExportPDFModal,
  PDFFormat,
  PDFTheme,
  ReportMode,
} from "./ExportPDFModal";
import { generateProfessionalPDF } from "./generateProfessionalPDF";

const STORAGE_KEY = "cg_helpdesk_dashboard_widgets_v1";

export function ReportsClient() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("LAST_30_DAYS");
  const [reportMode, setReportMode] = useState<ReportMode>("EXECUTIVO");
  const [stats, setStats] = useState<any>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(
    INITIAL_WIDGETS_CONFIG
  );
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar widgets do localStorage", e);
    }
  }, []);

  const saveWidgets = (updated: DashboardWidgetConfig[]) => {
    setWidgets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDefault = () => {
    saveWidgets(INITIAL_WIDGETS_CONFIG);
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Erro ao carregar dados de relatórios BI:", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleGeneratePDF = ({
    format,
    theme,
    mode,
  }: {
    format: PDFFormat;
    theme: PDFTheme;
    mode: ReportMode;
  }) => {
    generateProfessionalPDF({
      stats,
      config: { theme, mode },
      widgets,
    });
  };

  const handleExportCSV = (widget: DashboardWidgetConfig) => {
    if (!stats || !stats.charts) return;
    const data = stats.charts[widget.id];
    if (!data || !Array.isArray(data)) return;

    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data
      .map((row) => Object.values(row).map((v) => `"${v}"`).join(","))
      .join("\n");

    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${rows}`);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `cg_helpdesk_${widget.id}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  const kpis = stats?.kpis || {};
  const rankings = stats?.rankings || {};
  const charts = stats?.charts || {};

  // Filtrar widgets na tela conforme o Modo de Relatório
  const visibleWidgets = widgets.filter((w) => {
    if (!w.visible) return false;
    if (reportMode === "EXECUTIVO") {
      return ["bySector", "byOrigin", "byMonth", "byStatus"].includes(w.id);
    }
    if (reportMode === "OPERACIONAL") {
      return ["byStatus", "byDay", "byWeek", "byService", "byOrigin"].includes(
        w.id
      );
    }
    if (reportMode === "PRODUTIVIDADE") {
      return ["byTechnician", "avgTimeByTechnician", "byService"].includes(w.id);
    }
    if (reportMode === "PERFORMANCE") {
      return [
        "avgTimeByTechnician",
        "avgTimeByService",
        "avgTimeBySector",
        "byDay",
      ].includes(w.id);
    }
    return true; // PERSONALIZADO exibe todos os habilitados pelo usuário
  });

  return (
    <div className="space-y-6 pb-12">
      {/* BARRA SUPERIOR EXECUTIVA DE RELATÓRIOS E BI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Relatórios Executivos de BI & Indicadores
              </h2>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {reportMode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Consolidados gerenciais em tempo real do Departamento de TI — CG
              Construções
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Períodos Rápidos */}
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
            {[
              { id: "TODAY", label: "Hoje" },
              { id: "YESTERDAY", label: "Ontem" },
              { id: "LAST_7_DAYS", label: "7 dias" },
              { id: "LAST_30_DAYS", label: "30 dias" },
              { id: "THIS_MONTH", label: "Este Mês" },
              { id: "THIS_YEAR", label: "Ano" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === p.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            title="Atualizar Indicadores"
            className="h-9"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="h-9 font-medium"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Personalizar Widgets
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-9 font-semibold bg-primary hover:bg-primary/90"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Exportar PDF Profissional
          </Button>
        </div>
      </div>

      {/* SELETOR DE MODOS DE RELATÓRIO EXECUTIVO (EXECUTIVO, OPERACIONAL, PRODUTIVIDADE, PERFORMANCE, PERSONALIZADO) */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/20 border border-border/60 rounded-lg p-2">
        {[
          {
            id: "EXECUTIVO",
            label: "Executivo (C-Level)",
            desc: "KPIs e visão institucional por Obras e Origem",
          },
          {
            id: "OPERACIONAL",
            label: "Operacional (Fila e Fluxo)",
            desc: "Status em tempo real, evolução diária e semana",
          },
          {
            id: "PRODUTIVIDADE",
            label: "Produtividade (Equipe TI)",
            desc: "Chamados resolvidos e tempo médio por técnico",
          },
          {
            id: "PERFORMANCE",
            label: "Performance (SLA e Eficiência)",
            desc: "Tempos de resposta e taxa de resolução rápida",
          },
          {
            id: "PERSONALIZADO",
            label: "Personalizado (Livre)",
            desc: "Todos os gráficos visíveis e ordenados por você",
          },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setReportMode(m.id as ReportMode)}
            className={`flex-1 min-w-[170px] px-3 py-2 rounded-md text-left transition-all border ${
              reportMode === m.id
                ? "bg-card border-primary/50 text-foreground shadow-sm ring-1 ring-primary/20"
                : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <p className="text-xs font-bold">{m.label}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {m.desc}
            </p>
          </button>
        ))}
      </div>

      {/* LINHA DE 8 CARDS DE KPIS ANALÍTICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Chamados */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Chamados
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {kpis.totalTickets?.value || 0}
              </span>
              {typeof kpis.totalTickets?.changePercent === "number" && (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono px-1.5 py-0.5 ${
                    kpis.totalTickets.changePercent >= 0
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                      : "text-rose-500 border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {kpis.totalTickets.changePercent >= 0 ? "+" : ""}
                  {kpis.totalTickets.changePercent}% vs ant.
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Volume total ingressado no período
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Em Atendimento */}
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
              <span className="text-2xl font-bold text-amber-500">
                {kpis.inProgress?.value || 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Ativos em fila
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chamados com analistas em tratativa
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Concluídos */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Concluídos
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-500">
                {kpis.completed?.value || 0}
              </span>
              {typeof kpis.completed?.changePercent === "number" && (
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono px-1.5 py-0.5 ${
                    kpis.completed.changePercent >= 0
                      ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                      : "text-rose-500 border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {kpis.completed.changePercent >= 0 ? "+" : ""}
                  {kpis.completed.changePercent}% vs ant.
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Atendimentos finalizados com sucesso
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Aguardando & Agendados */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pendências (Aguardando)
              </span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {kpis.waiting?.value || 0}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                +{kpis.scheduled?.value || 0} Agendados
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aguardando peças, fornecedor ou retorno
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Tempo Médio de Atendimento */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tempo Médio Total
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-indigo-500 font-mono">
                {kpis.avgTimeMinutes?.formatted || "0 min"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({kpis.avgTimeMinutes?.value || 0} min)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Média entre abertura e encerramento
            </p>
          </CardContent>
        </Card>

        {/* KPI 6: Tempo Médio por Técnico */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tempo Médio / Técnico
              </span>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-teal-500 font-mono">
                {kpis.avgTimePerTech?.formatted || "0 min"}
              </span>
              <span className="text-xs text-muted-foreground">Esforço técnico</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Média balanceada por analista
            </p>
          </CardContent>
        </Card>

        {/* KPI 7: Quantidade de Técnicos */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Técnicos Ativos (TI / ADMIN)
              </span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {kpis.activeTechCount?.value || 0}
              </span>
              <span className="text-xs text-muted-foreground">Analistas</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Equipe habilitada a assumir chamados
            </p>
          </CardContent>
        </Card>

        {/* KPI 8: Taxa de Resolução Rápida */}
        <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Taxa de Resolução
              </span>
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground font-mono">
                {kpis.totalTickets?.value > 0
                  ? Math.round(
                      ((kpis.completed?.value || 0) / kpis.totalTickets.value) *
                        100
                    )
                  : 0}
                %
              </span>
              <span className="text-xs text-muted-foreground">do volume</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Chamados finalizados no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3 CARDS DE RANKING (TOP TÉCNICOS, SERVIÇOS, SETORES) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking 1: Top Técnicos */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Top Técnicos em Resolução
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topTechnicians?.length > 0 ? (
              rankings.topTechnicians.map((t: any, idx: number) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-foreground">
                      {t.count} resolvidos
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t.avgTimeMinutes} min médio
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum chamado resolvido por técnicos no período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ranking 2: Top Serviços */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Top Serviços mais Acionados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topServices?.length > 0 ? (
              rankings.topServices.map((s: any) => (
                <div key={s.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {s.name}
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {s.count} ({s.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(8, s.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum serviço registrado no período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ranking 3: Top Setores */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Setores institucionais com Maior Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {rankings.topSectors?.length > 0 ? (
              rankings.topSectors.map((sec: any) => (
                <div key={sec.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {sec.name}
                    </span>
                    <span className="font-bold font-mono text-foreground">
                      {sec.count} ({sec.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(8, sec.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum setor registrado no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRADE DE WIDGETS INTERATIVOS (FILTRADA PELO MODO ATIVO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleWidgets
          .sort((a, b) => a.order - b.order)
          .map((widget) => {
            const chartData = charts[widget.id] || [];
            const isTimeSeries = [
              "byDay",
              "byWeek",
              "byMonth",
            ].includes(widget.id);
            const unit = widget.id.startsWith("avgTime") ? "min" : "chamados";

            return (
              <Card
                key={widget.id}
                className={`border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col ${
                  widget.colSpan === 3
                    ? "md:col-span-2 lg:col-span-3"
                    : widget.colSpan === 2
                    ? "md:col-span-2 lg:col-span-2"
                    : "col-span-1"
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {widget.title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {widget.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={widget.currentType}
                      onChange={(e) => {
                        const next = widgets.map((w) =>
                          w.id === widget.id
                            ? {
                                ...w,
                                currentType: e.target.value as ChartType,
                              }
                            : w
                        );
                        saveWidgets(next);
                      }}
                      className="h-7 px-2 text-[11px] font-semibold rounded border border-border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary"
                      title="Alternar visualização"
                    >
                      {widget.allowedTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === "BAR" && "Barra"}
                          {type === "PIE" && "Pizza"}
                          {type === "DONUT" && "Rosca"}
                          {type === "LINE" && "Linha"}
                          {type === "AREA" && "Área"}
                          {type === "RADAR" && "Radar"}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleExportCSV(widget)}
                      title="Exportar em CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 flex-1">
                  <ChartWidget
                    data={chartData}
                    type={widget.currentType}
                    height={270}
                    unit={unit}
                    isTimeSeries={isTimeSeries}
                  />
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Modal de Customização de Layout (ADMIN) */}
      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgets={widgets}
        onUpdateWidgets={saveWidgets}
        onResetDefault={handleResetDefault}
      />

      {/* Modal Profissional de Exportação PDF em A4 / A3 Landscape */}
      <ExportPDFModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        currentMode={reportMode}
        periodLabel={stats?.periodRange?.label}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}
