import { prisma } from "@/lib/prisma";

export interface RequesterSuggestion {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
}

export interface RequesterHistorySummary {
  requesterId: string;
  requesterName: string;
  totalTickets: number;
  lastTicketDate: Date | null;
  lastTechnicianName: string | null;
  recentTickets: Array<{
    id: string;
    ticketNumber: number;
    problem: string;
    status: string;
    ticketDate: Date;
    technicianName: string | null;
  }>;
}

export async function suggestRequesters(query: string): Promise<RequesterSuggestion[]> {
  if (!query || query.trim().length === 0) {
    const defaultList = await prisma.requester.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });
    return defaultList;
  }

  const cleanQuery = query.trim();
  const list = await prisma.requester.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { email: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
  });

  return list;
}

export async function getOrCreateRequester(input: {
  id?: string;
  name: string;
  email?: string;
  department?: string;
}): Promise<{ id: string; name: string; email: string }> {
  // Se veio o ID, verifica se existe no banco
  if (input.id) {
    const existingById = await prisma.requester.findUnique({
      where: { id: input.id },
    });
    if (existingById && !existingById.deletedAt) {
      return {
        id: existingById.id,
        name: existingById.name,
        email: existingById.email,
      };
    }
  }

  const cleanName = input.name.trim();

  // Verifica se existe pelo nome exato (insensitive) ou e-mail
  const existing = await prisma.requester.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { name: { equals: cleanName, mode: "insensitive" } },
        ...(input.email ? [{ email: { equals: input.email.trim(), mode: "insensitive" as const } }] : []),
      ],
    },
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
    };
  }

  // Se não existir, cria automaticamente ("Não exigir cadastro prévio")
  const generatedEmail =
    input.email?.trim() ||
    `${cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")}@cgconstrucoes.local`;

  const created = await prisma.requester.create({
    data: {
      name: cleanName,
      email: generatedEmail,
      department: input.department || null,
      company: "CG Construções",
      isActive: true,
    },
  });

  return {
    id: created.id,
    name: created.name,
    email: created.email,
  };
}

export async function getRequesterHistory(requesterId: string): Promise<RequesterHistorySummary | null> {
  const requester = await prisma.requester.findUnique({
    where: { id: requesterId },
  });

  if (!requester || requester.deletedAt) {
    return null;
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      requesterId,
      deletedAt: null,
    },
    orderBy: {
      ticketDate: "desc",
    },
    include: {
      technician: {
        select: { name: true },
      },
    },
    take: 10,
  });

  const totalTickets = await prisma.ticket.count({
    where: {
      requesterId,
      deletedAt: null,
    },
  });

  const lastTicket = tickets[0] || null;
  const lastTicketDate = lastTicket ? lastTicket.ticketDate : null;

  // Busca o último técnico que atendeu esse solicitante
  let lastTechnicianName: string | null = null;
  for (const t of tickets) {
    if (t.technician?.name) {
      lastTechnicianName = t.technician.name;
      break;
    }
  }

  const recentTickets = tickets.slice(0, 5).map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    problem: t.problem,
    status: t.status,
    ticketDate: t.ticketDate,
    technicianName: t.technician?.name || null,
  }));

  return {
    requesterId: requester.id,
    requesterName: requester.name,
    totalTickets,
    lastTicketDate,
    lastTechnicianName,
    recentTickets,
  };
}
