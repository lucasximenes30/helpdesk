"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, History, Clock, AlertCircle } from "lucide-react";

export interface RequesterHistorySummary {
  requesterId: string;
  requesterName: string;
  totalTickets: number;
  lastTicketDate: string | null;
  lastTechnicianName: string | null;
  recentTickets: Array<{
    id: string;
    ticketNumber: number;
    problem: string;
    status: string;
    ticketDate: string;
    technicianName: string | null;
  }>;
}

interface RequesterHistoryCardProps {
  requesterId?: string | null;
  requesterName?: string;
}

export function RequesterHistoryCard({
  requesterId,
  requesterName,
}: RequesterHistoryCardProps) {
  const [history, setHistory] = useState<RequesterHistorySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requesterId) {
      setHistory(null);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/requesters/suggest?requesterId=${encodeURIComponent(requesterId!)}`
        );
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || null);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico do solicitante:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [requesterId]);

  if (!requesterId && !requesterName) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border border-border/60 bg-muted/20">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-primary" />
          <span>Carregando histórico do solicitante...</span>
        </CardContent>
      </Card>
    );
  }

  if (!history && requesterName) {
    return (
      <Card className="border border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Novo Solicitante identificado</p>
            <p className="text-muted-foreground mt-0.5">
              &quot;{requesterName}&quot; será cadastrado(a) automaticamente no sistema ao salvar o chamado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history) return null;

  return (
    <Card className="border border-border/80 bg-card/60 shadow-sm">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-border/40">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" />
          Histórico de Atendimentos — {history.requesterName}
        </CardTitle>
        <Badge variant="outline" className="text-[10px] font-mono">
          Total: {history.totalTickets} {history.totalTickets === 1 ? "chamado" : "chamados"}
        </Badge>
      </CardHeader>
      <CardContent className="p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/30 p-2 rounded border border-border/40">
            <span className="text-[10px] uppercase text-muted-foreground block font-medium">
              Último Atendimento
            </span>
            <span className="font-medium text-foreground">
              {history.lastTicketDate
                ? new Date(history.lastTicketDate).toLocaleDateString("pt-BR")
                : "Sem atendimentos"}
            </span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border/40">
            <span className="text-[10px] uppercase text-muted-foreground block font-medium">
              Último Técnico
            </span>
            <span className="font-medium text-foreground flex items-center gap-1 truncate">
              <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              {history.lastTechnicianName || "Nenhum atribuído"}
            </span>
          </div>
        </div>

        {history.recentTickets.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              Atendimentos Recentes
            </span>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {history.recentTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-primary text-[11px]">
                      #{t.ticketNumber}
                    </span>
                    <span className="truncate text-foreground font-medium max-w-[160px]">
                      {t.problem}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(t.ticketDate).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 uppercase tracking-tighter"
                    >
                      {t.status === "ABERTO"
                        ? "Em Atend."
                        : t.status === "RESOLVIDO"
                        ? "Resolvido"
                        : t.status === "AGUARDANDO_USUARIO"
                        ? "Aguardando"
                        : "Agendado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
