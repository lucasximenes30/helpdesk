import {
  LayoutDashboard,
  Ticket,
  Users,
  Layers,
  Building2,
  UserCheck,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral e indicadores",
  },
  {
    title: "Chamados",
    href: "/chamados",
    icon: Ticket,
    description: "Gestão de chamados e suporte",
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: Users,
    description: "Técnicos e administradores",
  },
  {
    title: "Serviços",
    href: "/servicos",
    icon: Layers,
    description: "Catálogo de serviços",
  },
  {
    title: "Setores",
    href: "/setores",
    icon: Building2,
    description: "Estrutura e departamentos",
  },
  {
    title: "Solicitantes",
    href: "/solicitantes",
    icon: UserCheck,
    description: "Clientes e solicitantes",
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    description: "Estatísticas e relatórios",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    description: "Parâmetros do sistema e White Label",
  },
];
