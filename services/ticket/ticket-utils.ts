import { OrigemType, StatusType } from "@prisma/client";

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
