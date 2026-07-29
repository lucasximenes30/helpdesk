import { prisma } from "@/lib/prisma";
import { OrigemType, PrioridadeType, StatusType } from "@prisma/client";

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
  monthYear?: string;
  sortBy?: "ticketDate" | "totalTimeMinutes" | "requester" | "service";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  userId?: string;
  role?: string;
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

  if (options.role === "SOLICITANTE" && options.userId) {
     const user = await prisma.user.findUnique({ where: { id: options.userId } });
     if (user) {
         where.requester = { email: user.email };
     }
  } else if (options.role === "TI" && options.userId) {
     // Técnico vê chamados atribuídos a ele ou não atribuídos (Fila Geral)
     where.AND = [
         { OR: [{ technicianId: options.userId }, { technicianId: null }] }
     ];
  }

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

    // O Prisma usará automaticamente os índices GIN criados via pg_trgm
    // para campos de texto (problem, description) quando processar modo insensitive (ILIKE).
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
