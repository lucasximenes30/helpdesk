import { prisma } from "@/lib/prisma";
import { OrigemType, PrioridadeType, StatusType } from "@prisma/client";
import { createAuditLog } from "@/services/audit/audit.service";
import { getOrCreateRequester } from "@/services/requester/requester.service";

export interface CreateTicketInput {
  requesterName: string;
  requesterEmail?: string;
  requesterId?: string;
  sectorId: string;
  technicianId?: string | null;
  serviceId: string;
  problem: string;
  description?: string;
  status?: StatusType;
  origin?: OrigemType;
  priority?: PrioridadeType;
  ticketDate?: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  observations?: string;
}

export interface UpdateTicketInput {
  requesterName?: string;
  requesterEmail?: string;
  requesterId?: string;
  sectorId?: string;
  technicianId?: string | null;
  serviceId?: string;
  problem?: string;
  description?: string;
  status?: StatusType;
  origin?: OrigemType;
  priority?: PrioridadeType;
  startTime?: Date | null;
  endTime?: Date | null;
  observations?: string;
}

export interface TicketFilterOptions {
  query?: string;
  status?: StatusType | "ALL";
  serviceId?: string | "ALL";
  sectorId?: string | "ALL";
  technicianId?: string | "ALL";
  origin?: OrigemType | "ALL";
  priority?: PrioridadeType | "ALL";
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  monthYear?: string; // "07-2026" filter by ticketMonthYear
  sortBy?: "ticketDate" | "totalTimeMinutes" | "requester" | "service";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Utilitário profissional para formatar o tempo total calculado (ex: 12 min, 1 h 20 min, 3 h)
 */
export function formatTotalTimeMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return "Em andamento";
  }
  if (minutes === 0) {
    return "< 1 min";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} min`;
}

/**
 * Calcula a diferença em minutos entre inicio e fim
 */
export function calculateTotalTimeMinutes(startTime?: Date | null, endTime?: Date | null): number | null {
  if (!startTime || !endTime) return null;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (end < start) return 0;
  return Math.round((end - start) / 60000);
}

/**
 * Retorna os rótulos legíveis para o status do chamado
 */
export function getStatusLabel(status: StatusType): string {
  switch (status) {
    case "EM_ATENDIMENTO":
      return "Em Atendimento";
    case "CONCLUIDO":
      return "Concluído";
    case "AGUARDANDO":
      return "Aguardando";
    case "AGENDADO":
      return "Agendado";
    default:
      return status;
  }
}

/**
 * Retorna os rótulos legíveis para origem
 */
export function getOriginLabel(origin: OrigemType): string {
  switch (origin) {
    case "MANUAL":
      return "Manual";
    case "WHATSAPP":
      return "WhatsApp";
    case "EMAIL":
      return "E-mail";
    default:
      return origin;
  }
}

/**
 * Retorna o mês/ano de controle no formato "MM-YYYY" (ex: "07-2026")
 */
export function getTicketMonthYear(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}-${year}`;
}

/**
 * Retorna o número do chamado formatado no formato "#X/MM-AAAA"
 */
export function formatTicketNumber(
  ticketNumber: number | string,
  ticketMonthYear?: string | null
): string {
  if (!ticketMonthYear) return `#${ticketNumber}`;
  return `#${ticketNumber}/${ticketMonthYear}`;
}

/**
 * Cria o ticket no banco gerando número sequencial mensal atômico e com retry para concorrência
 */
async function createTicketInMonthWithRetry(dataWithoutNum: any, ticketDateObj: Date) {
  const ticketMonthYear = getTicketMonthYear(ticketDateObj);
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      return await prisma.$transaction(async (tx) => {
        const lastTicket = await tx.ticket.findFirst({
          where: { ticketMonthYear },
          orderBy: { ticketNumber: "desc" },
          select: { ticketNumber: true },
        });

        const nextNumber = (lastTicket?.ticketNumber || 0) + 1;

        return await tx.ticket.create({
          data: {
            ...dataWithoutNum,
            ticketNumber: nextNumber,
            ticketMonthYear,
          },
          include: {
            requester: true,
            sector: true,
            technician: { select: { id: true, name: true, email: true } },
            service: true,
          },
        });
      });
    } catch (err: any) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw new Error(
          "Não foi possível gerar número único de chamado para este mês após tentativas concorrentes."
        );
      }
    }
  }
}

/**
 * Cria um chamado, incluindo criação automática de solicitante caso não exista
 */
export async function createTicket(
  input: CreateTicketInput,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  // 1. Resolve ou cria automaticamente o solicitante
  const requester = await getOrCreateRequester({
    id: input.requesterId,
    name: input.requesterName,
    email: input.requesterEmail,
  });

  const startTime = input.startTime ? new Date(input.startTime) : new Date();
  let endTime = input.endTime ? new Date(input.endTime) : null;
  const status = input.status || "EM_ATENDIMENTO";

  if (status === "CONCLUIDO" && !endTime) {
    endTime = new Date();
  }

  const totalTimeMinutes = calculateTotalTimeMinutes(startTime, endTime);

  const ticketDateObj = input.ticketDate ? new Date(input.ticketDate) : new Date();

  // 2. Cria o chamado com numeração mensal (reinicia a cada mês) e concorrência segura
  const ticket: any = await createTicketInMonthWithRetry(
    {
      problem: input.problem.trim(),
      description: input.description?.trim() || null,
      requesterId: requester.id,
      sectorId: input.sectorId,
      technicianId: input.technicianId || null,
      serviceId: input.serviceId,
      status,
      origin: input.origin || "MANUAL",
      priority: input.priority || "MEDIA",
      ticketDate: ticketDateObj,
      startTime,
      endTime,
      totalTimeMinutes,
      observations: input.observations?.trim() || null,
      isArchived: false,
    },
    ticketDateObj
  );

  // 3. Cria evento na timeline
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      actorId: actorId || null,
      actorName: actorName || "Sistema",
      eventType: "CREATED",
      description: "Chamado criado.",
    },
  });

  if (ticket.technician) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actorId || null,
        actorName: actorName || "Sistema",
        eventType: "TECHNICIAN_ASSIGNED",
        description: `${ticket.technician.name} assumiu.`,
      },
    });
  }

  // 4. Auditoria
  await createAuditLog({
    userId: actorId,
    action: "CREATE_TICKET",
    entity: "Ticket",
    entityId: ticket.id,
    details: `Criou chamado #${ticket.ticketNumber} — Problema: "${ticket.problem}" — Solicitante: "${requester.name}"`,
    ipAddress,
  });

  return ticket;
}

/**
 * Consulta um chamado específico por ID com todas as relações e timeline
 */
export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: true,
      sector: true,
      technician: { select: { id: true, name: true, email: true, avatar: true } },
      service: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      },
      history: {
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
    },
  });

  if (!ticket || ticket.deletedAt) return null;

  return ticket;
}

/**
 * Edita um chamado e registra histórico das alterações ocorridas na Timeline
 */
export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: true,
      sector: true,
      technician: true,
      service: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Chamado não encontrado");
  }

  // Se o nome do solicitante mudou ou veio uma solicitação, garante solicitante
  let requesterId = existing.requesterId;
  if (input.requesterName && input.requesterName !== existing.requester.name) {
    const requester = await getOrCreateRequester({
      id: input.requesterId,
      name: input.requesterName,
      email: input.requesterEmail,
    });
    requesterId = requester.id;
  } else if (input.requesterId) {
    requesterId = input.requesterId;
  }

  const startTime = input.startTime !== undefined ? (input.startTime ? new Date(input.startTime) : null) : existing.startTime;
  let endTime = input.endTime !== undefined ? (input.endTime ? new Date(input.endTime) : null) : existing.endTime;
  const status = input.status || existing.status;

  if (status === "CONCLUIDO" && !endTime) {
    endTime = new Date();
  } else if (status !== "CONCLUIDO" && input.status && existing.status === "CONCLUIDO" && !input.endTime) {
    endTime = null;
  }

  const totalTimeMinutes = calculateTotalTimeMinutes(startTime, endTime);

  // Executa o update
  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      requesterId,
      sectorId: input.sectorId !== undefined ? input.sectorId : existing.sectorId,
      technicianId: input.technicianId !== undefined ? input.technicianId : existing.technicianId,
      serviceId: input.serviceId !== undefined ? input.serviceId : existing.serviceId,
      problem: input.problem !== undefined ? input.problem.trim() : existing.problem,
      description: input.description !== undefined ? (input.description ? input.description.trim() : null) : existing.description,
      status,
      origin: input.origin || existing.origin,
      priority: input.priority || existing.priority,
      startTime,
      endTime,
      totalTimeMinutes,
      observations: input.observations !== undefined ? (input.observations ? input.observations.trim() : null) : existing.observations,
    },
    include: {
      requester: true,
      sector: true,
      technician: { select: { id: true, name: true, email: true } },
      service: true,
    },
  });

  // Registra mudanças na Timeline (TicketHistory)
  const historyEntries: Array<{ eventType: string; description: string; oldValue?: string; newValue?: string }> = [];

  // Mudança de Técnico
  if (existing.technicianId !== updated.technicianId) {
    if (updated.technician) {
      historyEntries.push({
        eventType: "TECHNICIAN_ASSIGNED",
        description: `${updated.technician.name} assumiu.`,
        oldValue: existing.technician?.name || "Sem técnico",
        newValue: updated.technician.name,
      });
    } else {
      historyEntries.push({
        eventType: "TECHNICIAN_ASSIGNED",
        description: "Técnico responsável removido.",
        oldValue: existing.technician?.name || "",
        newValue: "Sem técnico",
      });
    }
  }

  // Mudança de Serviço
  if (existing.serviceId !== updated.serviceId) {
    historyEntries.push({
      eventType: "SERVICE_CHANGED",
      description: `Serviço alterado para "${updated.service.name}".`,
      oldValue: existing.service.name,
      newValue: updated.service.name,
    });
  }

  // Mudança de Status
  if (existing.status !== updated.status) {
    const label = getStatusLabel(updated.status);
    historyEntries.push({
      eventType: updated.status === "CONCLUIDO" ? "COMPLETED" : "STATUS_CHANGED",
      description: updated.status === "CONCLUIDO" ? "Concluído." : `Status alterado para ${label}.`,
      oldValue: getStatusLabel(existing.status),
      newValue: label,
    });
  }

  for (const entry of historyEntries) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: updated.id,
        actorId: actorId || null,
        actorName: actorName || "Sistema",
        eventType: entry.eventType,
        description: entry.description,
        oldValue: entry.oldValue || null,
        newValue: entry.newValue || null,
      },
    });
  }

  await createAuditLog({
    userId: actorId,
    action: "UPDATE_TICKET",
    entity: "Ticket",
    entityId: updated.id,
    details: `Atualizou chamado #${updated.ticketNumber} (${updated.problem})`,
    ipAddress,
  });

  return updated;
}

/**
 * Exclusão (Soft Delete) de chamado
 */
export async function deleteTicket(id: string, actorId?: string, ipAddress?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    throw new Error("Chamado não encontrado");
  }

  const deleted = await prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId: actorId,
    action: "DELETE_TICKET",
    entity: "Ticket",
    entityId: id,
    details: `Exclusão lógica (Soft Delete) do chamado #${ticket.ticketNumber}`,
    ipAddress,
  });

  return deleted;
}

/**
 * Alternar arquivamento do chamado
 */
export async function archiveTicket(
  id: string,
  isArchived: boolean,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    throw new Error("Chamado não encontrado");
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { isArchived },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: id,
      actorId: actorId || null,
      actorName: actorName || "Sistema",
      eventType: "ARCHIVED",
      description: isArchived ? "Chamado arquivado." : "Chamado restaurado dos arquivados.",
    },
  });

  await createAuditLog({
    userId: actorId,
    action: "ARCHIVE_TICKET",
    entity: "Ticket",
    entityId: id,
    details: `${isArchived ? "Arquivou" : "Restaurou"} o chamado #${ticket.ticketNumber}`,
    ipAddress,
  });

  return updated;
}

/**
 * Duplicar chamado existente
 */
export async function duplicateTicket(
  id: string,
  actorId?: string,
  actorName?: string,
  ipAddress?: string
) {
  const original = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: true,
      sector: true,
      service: true,
    },
  });

  if (!original || original.deletedAt) {
    throw new Error("Chamado original não encontrado para duplicação");
  }

  const startTime = new Date();
  const ticketDateObj = new Date();
  const newTicket: any = await createTicketInMonthWithRetry(
    {
      problem: original.problem,
      description: original.description ? `(Duplicado do #${original.ticketNumber}) ${original.description}` : `Duplicado do chamado #${original.ticketNumber}`,
      requesterId: original.requesterId,
      sectorId: original.sectorId,
      technicianId: original.technicianId,
      serviceId: original.serviceId,
      status: "EM_ATENDIMENTO",
      origin: original.origin,
      priority: original.priority,
      ticketDate: ticketDateObj,
      startTime,
      endTime: null,
      totalTimeMinutes: null,
      observations: original.observations,
      isArchived: false,
    },
    ticketDateObj
  );

  await prisma.ticketHistory.create({
    data: {
      ticketId: newTicket.id,
      actorId: actorId || null,
      actorName: actorName || "Sistema",
      eventType: "DUPLICATED",
      description: `Chamado duplicado a partir do #${original.ticketNumber}.`,
    },
  });

  if (newTicket.technician) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: newTicket.id,
        actorId: actorId || null,
        actorName: actorName || "Sistema",
        eventType: "TECHNICIAN_ASSIGNED",
        description: `${newTicket.technician.name} assumiu.`,
      },
    });
  }

  await createAuditLog({
    userId: actorId,
    action: "DUPLICATE_TICKET",
    entity: "Ticket",
    entityId: newTicket.id,
    details: `Duplicou chamado #${original.ticketNumber} gerando novo chamado #${newTicket.ticketNumber}`,
    ipAddress,
  });

  return newTicket;
}

/**
 * Adicionar comentário interno ao chamado
 */
export async function addTicketComment(
  ticketId: string,
  content: string,
  authorId: string,
  authorName?: string
) {
  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId,
      content: content.trim(),
      isInternal: true,
    },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId: authorId,
      actorName: authorName || comment.author.name,
      eventType: "COMMENT_ADDED",
      description: `Adicionou comentário interno.`,
    },
  });

  return comment;
}

/**
 * Consulta paginada com filtros avançados e pesquisa em todas as propriedades
 */
export async function getTicketsPaginated(options: TicketFilterOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 10));
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    isArchived: options.isArchived === true,
  };

  if (options.status && options.status !== "ALL") {
    where.status = options.status;
  }
  if (options.serviceId && options.serviceId !== "ALL") {
    where.serviceId = options.serviceId;
  }
  if (options.sectorId && options.sectorId !== "ALL") {
    where.sectorId = options.sectorId;
  }
  if (options.technicianId && options.technicianId !== "ALL") {
    where.technicianId = options.technicianId;
  }
  if (options.origin && options.origin !== "ALL") {
    where.origin = options.origin;
  }
  if (options.priority && options.priority !== "ALL") {
    where.priority = options.priority;
  }
  if (options.monthYear) {
    where.ticketMonthYear = options.monthYear;
  } else if (options.startDate || options.endDate) {
    where.ticketDate = {};
    if (options.startDate) {
      where.ticketDate.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      where.ticketDate.lte = new Date(options.endDate);
    }
  }

  if (options.query && options.query.trim().length > 0) {
    const q = options.query.trim();
    const isNum = /^\d+$/.test(q);

    where.OR = [
      ...(isNum ? [{ ticketNumber: { equals: parseInt(q, 10) } }] : []),
      { problem: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { requester: { name: { contains: q, mode: "insensitive" } } },
      { requester: { email: { contains: q, mode: "insensitive" } } },
      { sector: { name: { contains: q, mode: "insensitive" } } },
      { service: { name: { contains: q, mode: "insensitive" } } },
      { technician: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // Mapeia ordem
  let orderBy: any = { ticketDate: "desc" };
  const direction = options.sortOrder === "asc" ? "asc" : "desc";

  if (options.sortBy === "ticketDate") {
    orderBy = { ticketDate: direction };
  } else if (options.sortBy === "totalTimeMinutes") {
    orderBy = { totalTimeMinutes: direction };
  } else if (options.sortBy === "requester") {
    orderBy = { requester: { name: direction } };
  } else if (options.sortBy === "service") {
    orderBy = { service: { name: direction } };
  }

  const [total, data] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        sector: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true, email: true, avatar: true } },
        service: { select: { id: true, name: true, category: true } },
        _count: { select: { comments: true, history: true } },
      },
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
