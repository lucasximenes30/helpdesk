"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  History,
  MessageSquare,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { RequesterHistoryCard } from "./RequesterHistoryCard";
import { Combobox } from "@/components/common/Combobox";

export interface TicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
  sectors: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; category?: string | null }>;
  technicians: Array<{ id: string; name: string; email: string }>;
  onSaved: () => void;
}

export function TicketModal({
  open,
  onOpenChange,
  ticketId,
  sectors,
  services,
  technicians,
  onSaved,
}: TicketModalProps) {
  const isEditing = Boolean(ticketId);

  const [activeTab, setActiveTab] = useState<"INFO" | "TIMELINE" | "COMMENTS">("INFO");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterId, setRequesterId] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("EM_ATENDIMENTO");
  const [origin, setOrigin] = useState("MANUAL");
  const [priority, setPriority] = useState("MEDIA");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [observations, setObservations] = useState("");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | null>(null);

  // Autocomplete Solicitante
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Timeline & Comentários
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  // Load ticket data if editing
  useEffect(() => {
    if (!open) {
      // Reset defaults when closing
      setActiveTab("INFO");
      setRequesterName("");
      setRequesterEmail("");
      setRequesterId(null);
      setSectorId("");
      setServiceId("");
      setTechnicianId("");
      setProblem("");
      setDescription("");
      setStatus("EM_ATENDIMENTO");
      setOrigin("MANUAL");
      setPriority("MEDIA");
      setStartTime(new Date().toISOString().slice(0, 16));
      setEndTime("");
      setObservations("");
      setTotalTimeMinutes(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setHistoryEvents([]);
      setComments([]);
      return;
    }

    if (ticketId) {
      fetchTicketDetails(ticketId);
    } else {
      setStartTime(new Date().toISOString().slice(0, 16));
    }
  }, [open, ticketId]);

  async function fetchTicketDetails(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequesterName(data.requester?.name || "");
        setRequesterEmail(data.requester?.email || "");
        setRequesterId(data.requester?.id || null);
        setSectorId(data.sectorId || "");
        setServiceId(data.serviceId || "");
        setTechnicianId(data.technicianId || "");
        setProblem(data.problem || "");
        setDescription(data.description || "");
        setStatus(data.status || "EM_ATENDIMENTO");
        setOrigin(data.origin || "MANUAL");
        setPriority(data.priority || "MEDIA");
        setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "");
        setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "");
        setObservations(data.observations || "");
        setTotalTimeMinutes(data.totalTimeMinutes || null);
        setHistoryEvents(data.history || []);
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Erro ao carregar chamado:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle requester autocomplete
  async function handleRequesterChange(val: string) {
    setRequesterName(val);
    if (requesterId && val !== requesterName) {
      setRequesterId(null); // Desvincula se alterou
    }

    if (val.trim().length >= 2) {
      try {
        const res = await fetch(`/api/requesters/suggest?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Erro ao buscar solicitantes:", err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelectSuggestion(s: { id: string; name: string; email: string }) {
    setRequesterId(s.id);
    setRequesterName(s.name);
    setRequesterEmail(s.email);
    setShowSuggestions(false);
  }

  // Format dynamic calculated time
  function getFormattedDuration(): string {
    let sTime = startTime ? new Date(startTime).getTime() : Date.now();
    let eTime = endTime ? new Date(endTime).getTime() : Date.now();
    if (status === "CONCLUIDO" && !endTime) {
      eTime = Date.now();
    }
    const mins = Math.max(0, Math.round((eTime - sTime) / 60000));
    if (mins === 0) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  // Save ticket
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requesterName || !sectorId || !serviceId || !problem) {
      alert("Por favor, preencha Solicitante, Setor, Serviço e Problema.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        requesterName,
        requesterEmail,
        requesterId,
        sectorId,
        serviceId,
        technicianId: technicianId || null,
        problem,
        description,
        status,
        origin,
        priority,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : null,
        observations,
      };

      const url = isEditing ? `/api/tickets/${ticketId}` : "/api/tickets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar chamado");
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar chamado");
    } finally {
      setSaving(false);
    }
  }

  // Add internal comment
  async function handleAddComment() {
    if (!newComment.trim() || !ticketId) return;
    setAddingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
    } finally {
      setAddingComment(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Chamado" : "Novo Chamado"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações operacionais, acompanhe a timeline e comentários internos."
              : "Substituição completa da planilha de TI com numeração automática e histórico."}
          </DialogDescription>
        </DialogHeader>

        {/* Abas */}
        <div className="flex items-center gap-1 border-b border-border/60 pb-2 mt-2">
          <Button
            type="button"
            variant={activeTab === "INFO" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("INFO")}
            className="text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Informações
          </Button>
          {isEditing && (
            <>
              <Button
                type="button"
                variant={activeTab === "TIMELINE" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("TIMELINE")}
                className="text-xs"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                Histórico (Timeline)
                {historyEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                    {historyEvents.length}
                  </Badge>
                )}
              </Button>
              <Button
                type="button"
                variant={activeTab === "COMMENTS" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("COMMENTS")}
                className="text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Comentários Internos
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                    {comments.length}
                  </Badge>
                )}
              </Button>
            </>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando detalhes do chamado...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* ABA: INFORMAÇÕES */}
            {activeTab === "INFO" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lado Esquerdo - Campos Principais (2 colunas) */}
                <div className="md:col-span-2 space-y-3">
                  {/* Solicitante (Combobox inteligente / Cadastro automático) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Solicitante * (Digite para auto-completar ou criar)
                    </label>
                    <Combobox
                      options={suggestions.map((s) => ({
                        id: s.id || s.name,
                        name: s.name,
                        subtitle: s.email,
                      }))}
                      value={requesterId || requesterName}
                      onChange={(val, item) => {
                        if (item) {
                          handleSelectSuggestion({
                            id: item.id,
                            name: item.name,
                            email: item.subtitle || "",
                          });
                        } else {
                          setRequesterName("");
                          setRequesterId(null);
                        }
                      }}
                      onSearchChange={(query) => {
                        setRequesterName(query);
                        handleRequesterChange(query);
                      }}
                      placeholder={requesterName || "Selecione ou crie o solicitante..."}
                      searchPlaceholder="Digite nome ou e-mail..."
                      allowCreate={true}
                      onCreate={(typedName) => {
                        setRequesterName(typedName);
                        setRequesterId(null);
                      }}
                      createLabelPrefix="+ Criar"
                    />
                  </div>

                  {/* Setor e Serviço */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Setor *
                      </label>
                      <Combobox
                        options={sectors.map((s) => ({
                          id: s.id,
                          name: s.name,
                        }))}
                        value={sectorId}
                        onChange={(val) => setSectorId(val || "")}
                        placeholder="Selecione o Setor..."
                        searchPlaceholder="Pesquisar setor..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Serviço (Catálogo) *
                      </label>
                      <Combobox
                        options={services.map((sv) => ({
                          id: sv.id,
                          name: sv.name,
                          badge: sv.category || "TI",
                        }))}
                        value={serviceId}
                        onChange={(val) => setServiceId(val || "")}
                        placeholder="Selecione o Serviço..."
                        searchPlaceholder="Pesquisar serviço..."
                      />
                    </div>
                  </div>

                  {/* Problema (Texto Livre Obrigatório) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Problema * (Texto Livre — Nunca Será Cadastro)
                    </label>
                    <Input
                      placeholder="Ex: Impressora apresentando lentidão ao imprimir boletos Fortes"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>

                  {/* Descrição (Opcional) */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Descrição Detalhada (Opcional)
                    </label>
                    <textarea
                      placeholder="Informe observações técnicas iniciais ou relato do usuário..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Status, Origem e Prioridade */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Status
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="EM_ATENDIMENTO">Em Atendimento</option>
                        <option value="CONCLUIDO">Concluído</option>
                        <option value="AGUARDANDO">Aguardando</option>
                        <option value="AGENDADO">Agendado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Origem
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      >
                        <option value="MANUAL">Manual</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="EMAIL">E-mail</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Prioridade
                      </label>
                      <select
                        className="w-full h-9 px-2 text-xs rounded-md border border-input bg-background"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="BAIXA">Baixa</option>
                        <option value="MEDIA">Média</option>
                        <option value="ALTA">Alta</option>
                        <option value="CRITICA">Crítica</option>
                      </select>
                    </div>
                  </div>

                  {/* Técnico Responsável */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Técnico Responsável (ADMIN ou TI)
                    </label>
                    <Combobox
                      options={technicians.map((t) => ({
                        id: t.id,
                        name: t.name,
                        subtitle: t.email,
                      }))}
                      value={technicianId}
                      onChange={(val) => setTechnicianId(val || "")}
                      placeholder="(Sem técnico — Fila Geral)"
                      searchPlaceholder="Pesquisar técnico (ADMIN/TI)..."
                    />
                  </div>

                  {/* Horários e Cálculo Automático de Tempo */}
                  <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Hora Início
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full text-xs bg-background border border-input rounded px-2 py-1 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Hora Encerramento
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full text-xs bg-background border border-input rounded px-2 py-1 mt-1"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded p-1 border border-primary/20">
                      <span className="text-[10px] uppercase font-semibold text-primary">
                        Tempo Total (Auto)
                      </span>
                      <span className="text-sm font-bold font-mono text-primary mt-0.5">
                        {getFormattedDuration()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito - Card de Histórico do Solicitante */}
                <div className="space-y-3">
                  <RequesterHistoryCard
                    requesterId={requesterId}
                    requesterName={requesterName}
                  />

                  {/* Observações Operacionais */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Observações
                    </label>
                    <textarea
                      placeholder="Anotações extras da equipe de TI..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: HISTÓRICO (TIMELINE) */}
            {activeTab === "TIMELINE" && (
              <div className="space-y-3 py-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trilha de Eventos e Alterações Operacionais
                </h4>
                {historyEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum evento registrado nesta timeline.
                  </p>
                ) : (
                  <div className="space-y-3 border-l-2 border-primary/30 pl-4 my-2">
                    {historyEvents.map((ev) => (
                      <div key={ev.id} className="relative flex flex-col gap-0.5 text-xs">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {ev.description}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {new Date(ev.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({new Date(ev.createdAt).toLocaleDateString("pt-BR")})
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Autor: <span className="font-medium">{ev.actorName || "Sistema"}</span>
                        </p>
                        {ev.oldValue && ev.newValue && (
                          <div className="text-[10px] bg-muted/40 p-1.5 rounded mt-1 font-mono">
                            De: <span className="line-through text-red-500">{ev.oldValue}</span> → Para:{" "}
                            <span className="text-emerald-500 font-bold">{ev.newValue}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA: COMENTÁRIOS INTERNOS */}
            {activeTab === "COMMENTS" && (
              <div className="space-y-4 py-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escreva um comentário interno para a equipe de TI..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={addingComment || !newComment.trim()}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Enviar
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum comentário interno cadastrado neste chamado.
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-border/60 bg-muted/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {c.author?.name || "Técnico TI"}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 uppercase tracking-tight"
                            >
                              {c.author?.role || "TI"}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(c.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-1 whitespace-pre-line">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "INFO" && (
              <DialogFooter className="gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Chamado"}
                </Button>
              </DialogFooter>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
