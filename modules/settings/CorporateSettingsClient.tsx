"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Building2,
  Palette,
  Users,
  FileText,
  Printer,
  ShieldCheck,
  Webhook,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  Layers,
  Sparkles,
  Send,
  Wrench,
  Upload,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/common/SectionCard";
import { useWhiteLabel } from "@/hooks/useWhiteLabel";
import { CorporateSettingsDTO } from "@/services/settings/settings.service";
import { CsvImportWizard } from "@/modules/import/CsvImportWizard";

export function CorporateSettingsClient() {
  const { config, updateConfig } = useWhiteLabel();
  const [activeTab, setActiveTab] = useState<
    "EMPRESA" | "APARENCIA" | "USUARIOS" | "CHAMADOS" | "RELATORIOS" | "AUDITORIA" | "INTEGRACOES" | "FERRAMENTAS"
  >("EMPRESA");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");

  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState<CorporateSettingsDTO>({
    companyId: "cg-construcoes-001",
    systemName: "CG Construções HelpDesk Pro",
    theme: "system",
    primaryColor: "#2563eb",
    secondaryColor: "#f1f5f9",
    department: "Departamento de TI",
    phone: "(11) 3456-7890",
    email: "ti@cgconstrucoes.com.br",
    website: "www.cgconstrucoes.com.br",
    address: "Av. Principal, 1000 - Centro",
    favicon: "/cg-logo.png",
    borderRadius: "0.5rem",
    compactMode: false,
    allowRegistration: false,
    minPasswordLen: 8,
    sessionTimeoutMin: 120,
    requireFirstAccess: true,
    maxLoginAttempts: 5,
    defaultStatus: "ABERTO",
    defaultOrigin: "MANUAL",
    defaultPriority: "MEDIA",
    defaultSlaHours: 24,
    autoArchive: true,
    archiveDays: 30,
    monthlyNumbering: true,
    reportShowLogo: true,
    reportShowFooter: true,
    reportDefaultTheme: "LIGHT",
    auditRetentionDays: 90,
    auditLogEnabled: true,
  });

  // Carrega do back-end /api/settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setForm(data);
          // Sincroniza o White Label visual ao carregar
          updateConfig({
            systemName: data.systemName || "CG Construções HelpDesk Pro",
            logo: data.favicon || "/cg-logo.png",
            primaryColor: data.primaryColor || "#2563eb",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: keyof CorporateSettingsDTO, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Se for alteração de aparência, reflete em tempo real no White Label
    if (key === "systemName") {
      updateConfig({ systemName: value });
    } else if (key === "primaryColor") {
      updateConfig({ primaryColor: value });
    } else if (key === "favicon") {
      updateConfig({ logo: value || "/cg-logo.png" });
    }
    setSaveStatus("IDLE");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("IDLE");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      const updated = await res.json();
      setForm(updated);
      setSaveStatus("SUCCESS");
      setTimeout(() => setSaveStatus("IDLE"), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Erro de conexão ao salvar");
      setSaveStatus("ERROR");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    setForm({
      companyId: "cg-construcoes-001",
      systemName: "CG Construções HelpDesk Pro",
      theme: "system",
      primaryColor: "#2563eb",
      secondaryColor: "#f1f5f9",
      department: "Departamento de TI",
      phone: "(11) 3456-7890",
      email: "ti@cgconstrucoes.com.br",
      website: "www.cgconstrucoes.com.br",
      address: "Av. Principal, 1000 - Centro",
      favicon: "/cg-logo.png",
      borderRadius: "0.5rem",
      compactMode: false,
      allowRegistration: false,
      minPasswordLen: 8,
      sessionTimeoutMin: 120,
      requireFirstAccess: true,
      maxLoginAttempts: 5,
      defaultStatus: "ABERTO",
      defaultOrigin: "MANUAL",
      defaultPriority: "MEDIA",
      defaultSlaHours: 24,
      autoArchive: true,
      archiveDays: 30,
      monthlyNumbering: true,
      reportShowLogo: true,
      reportShowFooter: true,
      reportDefaultTheme: "LIGHT",
      auditRetentionDays: 90,
      auditLogEnabled: true,
    });
    updateConfig({
      systemName: "CG Construções HelpDesk Pro",
      logo: "/cg-logo.png",
      primaryColor: "#2563eb",
    });
  };

  const tabs = [
    { id: "EMPRESA", label: "Empresa", icon: Building2 },
    { id: "APARENCIA", label: "Aparência", icon: Palette },
    { id: "USUARIOS", label: "Usuários & RBAC", icon: Users },
    { id: "CHAMADOS", label: "Chamados & SLA", icon: FileText },
    { id: "RELATORIOS", label: "Relatórios & PDF", icon: Printer },
    { id: "AUDITORIA", label: "Auditoria & Logs", icon: ShieldCheck },
    { id: "INTEGRACOES", label: "Integrações", icon: Webhook },
    { id: "FERRAMENTAS", label: "Ferramentas", icon: Wrench },
  ] as const;

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "RESETAR") return;
    setResetting(true);
    try {
      const res = await fetch("/api/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: "RESETAR" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao resetar banco de dados");
      }
      alert(data.message || "Banco de dados resetado com sucesso.");
      setResetModalOpen(false);
      setResetConfirmText("");
    } catch (e: any) {
      alert(e.message || "Erro ao resetar banco de dados");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/40 border border-border" />
        <div className="h-12 w-full rounded-xl bg-muted/30 border border-border" />
        <div className="h-96 rounded-2xl bg-muted/20 border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CARD BANNER PRINCIPAL WHITE LABEL PREVIEW EM TEMPO REAL */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm border border-border">
              <Image
                src={form.favicon || "/cg-logo.png"}
                alt={form.systemName}
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">
                  {form.systemName}
                </h3>
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  White Label Ativo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {form.department} • CNPJ 12.345.678/0001-99 • Sincronizado com PostgreSQL (Neon)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaults}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restaurar Padrão
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="font-semibold shadow-sm text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        {saveStatus === "SUCCESS" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Configurações corporativas atualizadas com sucesso e aplicadas ao sistema!
          </div>
        )}

        {saveStatus === "ERROR" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO ENTRE AS 7 ABAS OBRIGATÓRIAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DE CADA UMA DAS 7 ABAS */}
      <div className="space-y-6">
        {/* ======================= ABA 1: EMPRESA ======================= */}
        {activeTab === "EMPRESA" && (
          <SectionCard
            title="Identidade da Empresa Cliente"
            description="Informações cadastrais e logomarca institucional da CG Construções."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nome do Sistema
                </label>
                <Input
                  value={form.systemName}
                  onChange={(e) => handleChange("systemName", e.target.value)}
                  placeholder="Ex: CG Construções HelpDesk Pro"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Departamento Responsável
                </label>
                <Input
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="Ex: Departamento de TI"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Logomarca Oficial & Favicon (URL do arquivo)
                </label>
                <Input
                  value={form.favicon}
                  onChange={(e) => handleChange("favicon", e.target.value)}
                  placeholder="Ex: /cg-logo.png"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  E-mail Institucional de TI
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="ti@cgconstrucoes.com.br"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telefone de Suporte / Ramal
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(11) 3456-7890"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Website Corporativo
                </label>
                <Input
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="www.cgconstrucoes.com.br"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Endereço Sede / Unidade
                </label>
                <Input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Av. Principal, 1000 - Centro"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 2: APARÊNCIA ======================= */}
        {activeTab === "APARENCIA" && (
          <SectionCard
            title="Aparência, Cores & Tema"
            description="Personalização do design system visual com visualização instantânea."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Tema Padrão do Sistema
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "LIGHT", label: "Claro" },
                    { val: "DARK", label: "Escuro" },
                    { val: "system", label: "Sistema" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleChange("theme", item.val)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        form.theme === item.val
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary"
                          : "border-border text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Cor Primária Institucional
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="font-mono text-xs w-36"
                  />
                  <Badge variant="outline" className="text-xs">
                    Azul CG Padrão: #2563eb
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Arredondamento de Bordas (Border Radius)
                </label>
                <select
                  value={form.borderRadius}
                  onChange={(e) => handleChange("borderRadius", e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="0.25rem">Pequeno (0.25rem)</option>
                  <option value="0.5rem">Padrão Moderno (0.5rem)</option>
                  <option value="0.75rem">Arredondado (0.75rem)</option>
                  <option value="1rem">Pílula (1rem)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Modo Compacto de Tabelas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reduz o preenchimento (padding) nas listagens para telas com alta densidade de dados.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.compactMode}
                  onChange={(e) => handleChange("compactMode", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 3: USUÁRIOS & RBAC ======================= */}
        {activeTab === "USUARIOS" && (
          <SectionCard
            title="Acesso, Senhas & Políticas RBAC"
            description="Controla segurança de autenticação, auto-cadastro e tempos de sessão."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Permitir Auto-Cadastro
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permite que funcionários solicitem cadastro através da tela de login.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowRegistration}
                  onChange={(e) => handleChange("allowRegistration", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Forçar Redefinição no 1º Acesso
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usuário deve redefinir senha temporária ao logar pela primeira vez.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.requireFirstAccess}
                  onChange={(e) => handleChange("requireFirstAccess", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tamanho Mínimo da Senha
                </label>
                <Input
                  type="number"
                  value={form.minPasswordLen}
                  onChange={(e) => handleChange("minPasswordLen", Number(e.target.value))}
                  min={6}
                  max={20}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Timeout da Sessão Inativa (Minutos)
                </label>
                <Input
                  type="number"
                  value={form.sessionTimeoutMin}
                  onChange={(e) => handleChange("sessionTimeoutMin", Number(e.target.value))}
                  min={15}
                  max={720}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Máximo de Tentativas Inválidas (Bloqueio)
                </label>
                <Input
                  type="number"
                  value={form.maxLoginAttempts}
                  onChange={(e) => handleChange("maxLoginAttempts", Number(e.target.value))}
                  min={3}
                  max={10}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 4: CHAMADOS & SLA ======================= */}
        {activeTab === "CHAMADOS" && (
          <SectionCard
            title="Parâmetros de Chamados & SLA Padrão"
            description="Valores iniciais aplicados automaticamente ao abrir ou gerenciar chamados."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  SLA Padrão (Horas para Resolução)
                </label>
                <Input
                  type="number"
                  value={form.defaultSlaHours}
                  onChange={(e) => handleChange("defaultSlaHours", Number(e.target.value))}
                  min={1}
                  max={168}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status Inicial de Novos Chamados
                </label>
                <select
                  value={form.defaultStatus}
                  onChange={(e) => handleChange("defaultStatus", e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ABERTO">Aberto (Padrão)</option>
                  <option value="PENDENTE">Pendente (Requer Triagem)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Origem Padrão na Abertura
                </label>
                <select
                  value={form.defaultOrigin}
                  onChange={(e) => handleChange("defaultOrigin", e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MANUAL">Manual (Portal Web)</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">E-mail</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Prioridade Padrão
                </label>
                <select
                  value={form.defaultPriority}
                  onChange={(e) => handleChange("defaultPriority", e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média (Padrão)</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 md:col-span-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      Numeração Sequencial com Reinício Mensal
                    </p>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      Etapa 6 Ativo
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O número dos chamados é gerado por mês (ex: #1/07-2026, #2/07-2026) e reinicia no dia 1º de cada mês de forma automática.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.monthlyNumbering}
                  onChange={(e) => handleChange("monthlyNumbering", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Arquivar Resolvidos Automaticamente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mover chamados antigos finalizados para o arquivo histórico.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoArchive}
                  onChange={(e) => handleChange("autoArchive", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Dias Após Conclusão para Arquivar
                </label>
                <Input
                  type="number"
                  value={form.archiveDays}
                  onChange={(e) => handleChange("archiveDays", Number(e.target.value))}
                  min={7}
                  max={365}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 5: RELATÓRIOS & PDF ======================= */}
        {activeTab === "RELATORIOS" && (
          <SectionCard
            title="Relatórios Executivos & Exportação PDF"
            description="Define diretrizes institucionais para documentos exportados pelo sistema."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Exibir Logomarca Oficial no Cabeçalho
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inclui a logo da CG Construções no topo esquerdo do documento PDF.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.reportShowLogo}
                  onChange={(e) => handleChange("reportShowLogo", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Exibir Rodapé e Paginação Institucional
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inclui assinatura CG Construções | Depto. de TI em todas as páginas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.reportShowFooter}
                  onChange={(e) => handleChange("reportShowFooter", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tema Padrão do Relatório PDF
                </label>
                <select
                  value={form.reportDefaultTheme}
                  onChange={(e) => handleChange("reportDefaultTheme", e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="LIGHT">Tema Claro (Fundo Branco Padrão)</option>
                  <option value="DARK">Tema Escuro (Corporativo Ardósia)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
                <Printer className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Formato Fixo: Landscape (A4 Paisagem)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conforme norma corporativa, todos os relatórios executivos gerenciais são desenhados vetorialmente na orientação Landscape para perfeita disposição das tabelas de BI.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 6: AUDITORIA & LOGS ======================= */}
        {activeTab === "AUDITORIA" && (
          <SectionCard
            title="Políticas de Auditoria & Retenção"
            description="Controle de rastreabilidade, histórico de chamados e conformidade."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Registro de Log de Auditoria Ativo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registra todas as ações administrativas, alterações de status e permissões.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.auditLogEnabled}
                  onChange={(e) => handleChange("auditLogEnabled", e.target.checked)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Período de Retenção de Logs (Dias)
                </label>
                <Input
                  type="number"
                  value={form.auditRetentionDays}
                  onChange={(e) => handleChange("auditRetentionDays", Number(e.target.value))}
                  min={30}
                  max={1825}
                />
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/10 md:col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-sm text-foreground">
                    Rastreamento Integral
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  O módulo de auditoria no HelpDesk Pro grava alterações em <code className="font-mono text-primary">tickets</code>, <code className="font-mono text-primary">users</code> e <code className="font-mono text-primary">settings</code>, possibilitando consultas jurídicas e gerenciais por período.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ======================= ABA 7: INTEGRAÇÕES ======================= */}
        {activeTab === "INTEGRACOES" && (
          <SectionCard
            title="Conectores Institucionais & Webhooks"
            description="Canais conectados à abertura de chamados e notificações corporativas."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WhatsApp Webhook Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Conector WhatsApp API (Meta / Twilio)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Canal para abertura e notificações por celular
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                    Conectado
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Webhook URL Endpoint
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      defaultValue="https://helpdesk.cgconstrucoes.com.br/api/webhooks/whatsapp"
                      readOnly
                      className="text-xs font-mono bg-background"
                    />
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      Testar
                    </Button>
                  </div>
                </div>
              </div>

              {/* SMTP / Email Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Servidor SMTP / E-mail Institucional
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Envio de relatórios PDF e comprovantes de chamado
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">
                    Ativo (TLS 587)
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">
                    Host de Envio SMTP
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      defaultValue="smtp.cgconstrucoes.com.br"
                      readOnly
                      className="text-xs font-mono bg-background"
                    />
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      Disparar Teste
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* 8. ABA FERRAMENTAS — IMPORTAÇÃO CSV & RESET DE BANCO */}
        {activeTab === "FERRAMENTAS" && (
          <SectionCard
            title="Ferramentas & Manutenção do Banco de Dados"
            description="Importador inteligente de planilhas antigas e reinicialização segura de dados operacionais"
          >
            <div className="space-y-6">
              {/* Importador Inteligente de CSV */}
              <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Importador Inteligente de Histórico CSV
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                        Assistente em 5 etapas para importação de planilhas antigas da empresa (ex: Controle de Chamados). Mapeia colunas, prevê duplicidades, cria novos solicitantes e insere os registros preservando técnicos e serviços já cadastrados no banco.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setImportWizardOpen(true)}
                    className="shrink-0 font-semibold shadow-sm text-xs"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Abrir Importador CSV
                  </Button>
                </div>
              </div>

              {/* Reset Operacional do Banco */}
              <div className="p-5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          Reset de Dados Operacionais
                        </h3>
                        <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-[10px]">
                          Ação Crítica
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                        Exclui todos os chamados, comentários, anexos e histórico operacional do sistema, mantendo a estrutura institucional intacta (Empresa, Setores, Serviços, Usuários e RBAC).
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setResetModalOpen(true)}
                    className="shrink-0 font-semibold shadow-sm text-xs"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetar Banco...
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* MODAL DO IMPORTADOR CSV */}
      <CsvImportWizard
        open={importWizardOpen}
        onClose={() => setImportWizardOpen(false)}
      />

      {/* MODAL DE CONFIRMAÇÃO DE RESET DO BANCO */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Confirmar Reset do Banco
                </h3>
                <p className="text-xs text-muted-foreground">
                  Todos os chamados e dados operacionais serão excluídos.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Registros que serão preservados:</p>
              <p>Empresa, Configurações, Setores, Serviços, Usuários, Cargos e Tema.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Digite <span className="font-mono font-bold text-red-500">RESETAR</span> para confirmar:
              </label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESETAR"
                className="font-mono text-center tracking-widest uppercase font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmText("");
                }}
                disabled={resetting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={resetConfirmText !== "RESETAR" || resetting}
                onClick={handleResetDatabase}
                className="font-semibold"
              >
                {resetting ? "Resetando..." : "Confirmar Reset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
