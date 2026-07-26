import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type DashboardPeriod =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "CUSTOM";

export interface DashboardFilterParams {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
  sectorId?: string;
  serviceId?: string;
  technicianId?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
  percentage?: number;
  color?: string;
  id?: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  total: number;
  concluidos: number;
  emAtendimento: number;
}

export interface DashboardStatsResult {
  kpis: {
    totalTickets: { value: number; changePercent: number; prevValue: number };
    inProgress: { value: number };
    completed: { value: number; changePercent: number; prevValue: number };
    waiting: { value: number };
    scheduled: { value: number };
    avgTimeMinutes: { value: number; formatted: string };
    avgTimePerTech: { value: number; formatted: string };
    activeTechCount: { value: number };
  };
  rankings: {
    topTechnicians: Array<{
      id: string;
      name: string;
      email: string;
      count: number;
      avgTimeMinutes: number;
      percentage: number;
    }>;
    topServices: Array<{
      id: string;
      name: string;
      category: string;
      count: number;
      percentage: number;
    }>;
    topSectors: Array<{
      id: string;
      name: string;
      count: number;
      percentage: number;
    }>;
  };
  charts: {
    byTechnician: ChartDataPoint[];
    bySector: ChartDataPoint[];
    byService: ChartDataPoint[];
    byStatus: ChartDataPoint[];
    byOrigin: ChartDataPoint[];
    avgTimeByTechnician: ChartDataPoint[];
    avgTimeByService: ChartDataPoint[];
    avgTimeBySector: ChartDataPoint[];
    byDay: TimeSeriesPoint[];
    byWeek: TimeSeriesPoint[];
    byMonth: TimeSeriesPoint[];
  };
  periodRange: {
    start: string;
    end: string;
    label: string;
  };
}

function getPeriodRange(params: DashboardFilterParams): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
} {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let label = "Últimos 30 dias";

  if (params.period === "TODAY") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    label = "Hoje";
  } else if (params.period === "YESTERDAY") {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    end = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    label = "Ontem";
  } else if (params.period === "LAST_7_DAYS") {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    label = "Últimos 7 dias";
  } else if (params.period === "LAST_30_DAYS" || !params.period) {
    start = new Date(now);
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    label = "Últimos 30 dias";
  } else if (params.period === "THIS_MONTH") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now);
    label = "Este mês";
  } else if (params.period === "THIS_YEAR") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now);
    label = "Ano atual";
  } else if (params.period === "CUSTOM" && params.startDate && params.endDate) {
    start = new Date(params.startDate);
    end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    label = `${start.toLocaleDateString("pt-BR")} a ${end.toLocaleDateString("pt-BR")}`;
  }

  // Calcular período anterior proporcional para comparação de crescimento/queda
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd, label };
}

function formatMinutes(minutes: number): string {
  const mins = Math.max(0, Math.round(minutes));
  if (mins === 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function getDashboardStats(
  params: DashboardFilterParams = {}
): Promise<DashboardStatsResult> {
  const range = getPeriodRange(params);

  // Filtro base dos chamados no período atual
  const whereCurrent: Prisma.TicketWhereInput = {
    deletedAt: null,
    createdAt: {
      gte: range.start,
      lte: range.end,
    },
  };

  // Filtro base dos chamados no período anterior (para KPI comparativo)
  const wherePrevious: Prisma.TicketWhereInput = {
    deletedAt: null,
    createdAt: {
      gte: range.prevStart,
      lte: range.prevEnd,
    },
  };

  if (params.sectorId) {
    whereCurrent.sectorId = params.sectorId;
    wherePrevious.sectorId = params.sectorId;
  }
  if (params.serviceId) {
    whereCurrent.serviceId = params.serviceId;
    wherePrevious.serviceId = params.serviceId;
  }
  if (params.technicianId) {
    whereCurrent.technicianId = params.technicianId;
    wherePrevious.technicianId = params.technicianId;
  }

  // Consultar todos os tickets do período para análises e agregações de BI
  const [currentTickets, previousTickets, activeTechs, allSectors, allServices, allUsers] =
    await Promise.all([
      prisma.ticket.findMany({
        where: whereCurrent,
        include: {
          sector: true,
          service: true,
          technician: true,
          requester: true,
        },
      }),
      prisma.ticket.findMany({
        where: wherePrevious,
        select: {
          id: true,
          status: true,
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ["ADMIN", "TI"] },
          isActive: true,
        },
      }),
      prisma.sector.findMany(),
      prisma.service.findMany(),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "TI"] } },
      }),
    ]);

  // 1. CÁLCULO DOS KPIs
  const totalTickets = currentTickets.length;
  const prevTotalTickets = previousTickets.length;
  const changePercentTotal =
    prevTotalTickets > 0
      ? Math.round(((totalTickets - prevTotalTickets) / prevTotalTickets) * 100)
      : totalTickets > 0
      ? 100
      : 0;

  const inProgress = currentTickets.filter((t) => t.status === "EM_ATENDIMENTO").length;
  const completed = currentTickets.filter((t) => t.status === "CONCLUIDO").length;
  const prevCompleted = previousTickets.filter((t) => t.status === "CONCLUIDO").length;
  const changePercentCompleted =
    prevCompleted > 0
      ? Math.round(((completed - prevCompleted) / prevCompleted) * 100)
      : completed > 0
      ? 100
      : 0;

  const waiting = currentTickets.filter((t) => t.status === "AGUARDANDO").length;
  const scheduled = currentTickets.filter((t) => t.status === "AGENDADO").length;

  const completedWithTime = currentTickets.filter(
    (t) => t.status === "CONCLUIDO" && typeof t.totalTimeMinutes === "number" && t.totalTimeMinutes > 0
  );

  const avgTimeMinutesVal =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((acc, t) => acc + (t.totalTimeMinutes || 0), 0) /
            completedWithTime.length
        )
      : 0;

  const avgTimePerTechVal =
    activeTechs > 0 && completedWithTime.length > 0
      ? Math.round(avgTimeMinutesVal / Math.max(1, activeTechs))
      : avgTimeMinutesVal;

  // 2. AGRUPAMENTOS PARA OS 11 GRÁFICOS
  // 2.1 Por Técnico
  const techMap: Record<string, { name: string; count: number; totalTime: number; completedCount: number }> = {};
  allUsers.forEach((u) => {
    techMap[u.id] = { name: u.name, count: 0, totalTime: 0, completedCount: 0 };
  });
  techMap["unassigned"] = { name: "Fila Geral (Sem Atribuição)", count: 0, totalTime: 0, completedCount: 0 };

  // 2.2 Por Setor
  const sectorMap: Record<string, { name: string; count: number; totalTime: number; completedCount: number }> = {};
  allSectors.forEach((sec) => {
    sectorMap[sec.id] = { name: sec.name, count: 0, totalTime: 0, completedCount: 0 };
  });

  // 2.3 Por Serviço
  const serviceMap: Record<string, { name: string; category: string; count: number; totalTime: number; completedCount: number }> = {};
  allServices.forEach((srv) => {
    serviceMap[srv.id] = { name: srv.name, category: srv.category || "TI", count: 0, totalTime: 0, completedCount: 0 };
  });

  // 2.4 Por Origem
  const originMap: Record<string, number> = {
    MANUAL: 0,
    WHATSAPP: 0,
    EMAIL: 0,
  };

  currentTickets.forEach((t) => {
    // Tech
    const techKey = t.technicianId || "unassigned";
    if (!techMap[techKey]) {
      techMap[techKey] = {
        name: t.technician?.name || "Outro",
        count: 0,
        totalTime: 0,
        completedCount: 0,
      };
    }
    techMap[techKey].count += 1;
    if (t.status === "CONCLUIDO" && typeof t.totalTimeMinutes === "number") {
      techMap[techKey].totalTime += t.totalTimeMinutes;
      techMap[techKey].completedCount += 1;
    }

    // Sector
    if (t.sectorId && sectorMap[t.sectorId]) {
      sectorMap[t.sectorId].count += 1;
      if (t.status === "CONCLUIDO" && typeof t.totalTimeMinutes === "number") {
        sectorMap[t.sectorId].totalTime += t.totalTimeMinutes;
        sectorMap[t.sectorId].completedCount += 1;
      }
    }

    // Service
    if (t.serviceId && serviceMap[t.serviceId]) {
      serviceMap[t.serviceId].count += 1;
      if (t.status === "CONCLUIDO" && typeof t.totalTimeMinutes === "number") {
        serviceMap[t.serviceId].totalTime += t.totalTimeMinutes;
        serviceMap[t.serviceId].completedCount += 1;
      }
    }

    // Origin
    const orig = t.origin || "MANUAL";
    originMap[orig] = (originMap[orig] || 0) + 1;
  });

  // Formatar dados dos gráficos
  const byTechnician: ChartDataPoint[] = Object.entries(techMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const bySector: ChartDataPoint[] = Object.entries(sectorMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const byService: ChartDataPoint[] = Object.entries(serviceMap)
    .filter(([_, data]) => data.count > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: data.count,
      percentage: totalTickets > 0 ? Math.round((data.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const byStatus: ChartDataPoint[] = [
    { name: "Em Atendimento", value: inProgress, color: "#f59e0b" },
    { name: "Concluído", value: completed, color: "#10b981" },
    { name: "Aguardando", value: waiting, color: "#3b82f6" },
    { name: "Agendado", value: scheduled, color: "#8b5cf6" },
  ];

  const byOrigin: ChartDataPoint[] = [
    { name: "Portal / Manual", value: originMap.MANUAL || 0, color: "#3b82f6" },
    { name: "WhatsApp", value: originMap.WHATSAPP || 0, color: "#10b981" },
    { name: "E-mail", value: originMap.EMAIL || 0, color: "#6366f1" },
  ];

  const avgTimeByTechnician: ChartDataPoint[] = Object.entries(techMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => b.value - a.value);

  const avgTimeByService: ChartDataPoint[] = Object.entries(serviceMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => b.value - a.value);

  const avgTimeBySector: ChartDataPoint[] = Object.entries(sectorMap)
    .filter(([_, data]) => data.completedCount > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      value: Math.round(data.totalTime / data.completedCount),
    }))
    .sort((a, b) => b.value - a.value);

  // 3. SÉRIES TEMPORAIS (Dia, Semana, Mês)
  const byDayMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};
  const byWeekMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};
  const byMonthMap: Record<string, { label: string; total: number; concluidos: number; emAtendimento: number }> = {};

  currentTickets.forEach((t) => {
    const d = new Date(t.createdAt);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    if (!byDayMap[dateStr]) {
      byDayMap[dateStr] = { label: dayLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byDayMap[dateStr].total += 1;
    if (t.status === "CONCLUIDO") byDayMap[dateStr].concluidos += 1;
    if (t.status === "EM_ATENDIMENTO") byDayMap[dateStr].emAtendimento += 1;

    // Semana (Início do Domingo daquela semana)
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const weekLabel = `Semana ${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
    if (!byWeekMap[weekKey]) {
      byWeekMap[weekKey] = { label: weekLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byWeekMap[weekKey].total += 1;
    if (t.status === "CONCLUIDO") byWeekMap[weekKey].concluidos += 1;
    if (t.status === "EM_ATENDIMENTO") byWeekMap[weekKey].emAtendimento += 1;

    // Mês
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase();
    if (!byMonthMap[monthKey]) {
      byMonthMap[monthKey] = { label: monthLabel, total: 0, concluidos: 0, emAtendimento: 0 };
    }
    byMonthMap[monthKey].total += 1;
    if (t.status === "CONCLUIDO") byMonthMap[monthKey].concluidos += 1;
    if (t.status === "EM_ATENDIMENTO") byMonthMap[monthKey].emAtendimento += 1;
  });

  const byDay: TimeSeriesPoint[] = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const byWeek: TimeSeriesPoint[] = Object.entries(byWeekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const byMonth: TimeSeriesPoint[] = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // 4. RANKINGS DE BI
  const topTechnicians = allUsers
    .map((u) => {
      const d = techMap[u.id] || { count: 0, totalTime: 0, completedCount: 0 };
      const avg = d.completedCount > 0 ? Math.round(d.totalTime / d.completedCount) : 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        count: d.count,
        avgTimeMinutes: avg,
        percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topServices = Object.entries(serviceMap)
    .map(([id, d]) => ({
      id,
      name: d.name,
      category: d.category,
      count: d.count,
      percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topSectors = Object.entries(sectorMap)
    .map(([id, d]) => ({
      id,
      name: d.name,
      count: d.count,
      percentage: totalTickets > 0 ? Math.round((d.count / totalTickets) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    kpis: {
      totalTickets: {
        value: totalTickets,
        changePercent: changePercentTotal,
        prevValue: prevTotalTickets,
      },
      inProgress: { value: inProgress },
      completed: {
        value: completed,
        changePercent: changePercentCompleted,
        prevValue: prevCompleted,
      },
      waiting: { value: waiting },
      scheduled: { value: scheduled },
      avgTimeMinutes: {
        value: avgTimeMinutesVal,
        formatted: formatMinutes(avgTimeMinutesVal),
      },
      avgTimePerTech: {
        value: avgTimePerTechVal,
        formatted: formatMinutes(avgTimePerTechVal),
      },
      activeTechCount: { value: activeTechs },
    },
    rankings: {
      topTechnicians,
      topServices,
      topSectors,
    },
    charts: {
      byTechnician,
      bySector,
      byService,
      byStatus,
      byOrigin,
      avgTimeByTechnician,
      avgTimeByService,
      avgTimeBySector,
      byDay,
      byWeek,
      byMonth,
    },
    periodRange: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      label: range.label,
    },
  };
}
