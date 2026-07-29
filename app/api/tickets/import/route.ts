export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/services/rbac/rbac.service";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";
import { createTicket } from "@/services/ticket/create-ticket.service";

// Função para converter HH:MM:SS ou decimais do Excel para Date
function excelTimeToString(val: any): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    // Tentar ler HH:mm
    if (val.includes(":")) {
      const parts = val.split(":");
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  if (typeof val === "number") {
    // O excel guarda hora como fração do dia
    let totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return null;
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel base date is Dec 30 1899
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  if (typeof val === "string") {
    // 27/07/2026 -> 2026-07-27
    const parts = val.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return val;
  }
  return null;
}

function mapStatus(status: string): any {
  const s = status.toLowerCase().trim();
  if (s.includes("concluí") || s.includes("resolvido")) return "RESOLVIDO";
  if (s.includes("andamento") || s.includes("andamento")) return "EM_ANDAMENTO";
  if (s.includes("aguardando") || s.includes("esperando")) return "AGUARDANDO_USUARIO";
  if (s.includes("cancelado")) return "CANCELADO";
  return "ABERTO"; // Default
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const canCreate = await hasPermission(session.id, "chamados.create");
    if (!canCreate) return NextResponse.json({ error: "Acesso negado: chamados.create" }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // O header costuma estar na linha 1 ou 2. Se as linhas 1 estiver em branco/título, pulemos.
    const rawData = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
    
    // Identificar a linha do cabeçalho
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
        if (rawData[i].some((cell: string) => typeof cell === "string" && cell.toLowerCase().includes("solicitante"))) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = rawData[headerRowIndex] as string[];
    const rows = rawData.slice(headerRowIndex + 1);

    const getCol = (row: any[], headerMatches: string[]) => {
      const idx = headers.findIndex(h => h && headerMatches.some(m => h.toLowerCase().includes(m)));
      return idx >= 0 ? row[idx] : null;
    };

    let importedCount = 0;
    let errors = [];

    // Busca caches
    const cachedSectors: Record<string, string> = {};
    const cachedServices: Record<string, string> = {};
    const cachedUsers: Record<string, string> = {}; // Para técnico
    const cachedRequesters: Record<string, string> = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(Boolean)) continue; // Linha vazia

      const solicitanteNome = getCol(row, ["solicitante", "cliente", "nome"]) || "Usuário Não Informado";
      const setorNome = getCol(row, ["setor", "obra", "departamento"]) || "Geral";
      const tecnicoNome = getCol(row, ["técnico", "tecnico", "responsável", "responsavel"]);
      const dataChamado = parseExcelDate(getCol(row, ["data", "abertura"]));
      const horaInicio = excelTimeToString(getCol(row, ["hora início", "hora inicio", "início", "abertura"]));
      const problema = getCol(row, ["problema", "título", "assunto"]) || "Problema não informado";
      const descricao = getCol(row, ["descrição", "detalhes"]);
      const servicoNome = getCol(row, ["serviço", "servico", "categoria"]) || "Geral";
      const statusRaw = getCol(row, ["status", "situação"]) || "Aberto";
      const encerramento = excelTimeToString(getCol(row, ["encerramento", "hora fim", "fim", "fechamento"]));
      // const tempo = getCol(row, ["média de tempo", "tempo", "duração"]); // Calculado automaticamente

      try {
        // 1. Resolver Setor
        let sectorId = cachedSectors[setorNome.toLowerCase()];
        if (!sectorId) {
          let sector = await prisma.sector.findFirst({ where: { name: { equals: setorNome, mode: "insensitive" } } });
          if (!sector) {
            sector = await prisma.sector.create({ data: { name: setorNome } });
          }
          sectorId = sector.id;
          cachedSectors[setorNome.toLowerCase()] = sectorId;
        }

        // 2. Resolver Serviço
        let serviceId = cachedServices[servicoNome.toLowerCase()];
        if (!serviceId) {
          let service = await prisma.service.findFirst({ where: { name: { equals: servicoNome, mode: "insensitive" } } });
          if (!service) {
            service = await prisma.service.create({ data: { name: servicoNome, slaHours: 24 } });
          }
          serviceId = service.id;
          cachedServices[servicoNome.toLowerCase()] = serviceId;
        }

        // 3. Resolver Requisitante
        let requesterId = cachedRequesters[solicitanteNome.toLowerCase()];
        if (!requesterId) {
          let req = await prisma.requester.findFirst({ where: { name: { equals: solicitanteNome, mode: "insensitive" } } });
          if (!req) {
            req = await prisma.requester.create({ data: { name: solicitanteNome, email: `${solicitanteNome.replace(/\s+/g, '').toLowerCase()}@importado.local` } });
          }
          requesterId = req.id;
          cachedRequesters[solicitanteNome.toLowerCase()] = requesterId;
        }

        // 4. Resolver Técnico
        let technicianId = null;
        if (tecnicoNome) {
          technicianId = cachedUsers[tecnicoNome.toLowerCase()];
          if (!technicianId) {
            const user = await prisma.user.findFirst({ where: { name: { equals: tecnicoNome, mode: "insensitive" }, role: { in: ["TI", "ADMIN"] } } });
            if (user) {
              technicianId = user.id;
              cachedUsers[tecnicoNome.toLowerCase()] = technicianId;
            }
          }
        }

        // 5. Montar Datas
        const ticketDate = dataChamado ? new Date(dataChamado) : new Date();
        let startTime = new Date(ticketDate);
        if (horaInicio) {
          const [h, m] = horaInicio.split(":");
          startTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        }

        let endTime = null;
        if (encerramento) {
          endTime = new Date(ticketDate);
          const [h, m] = encerramento.split(":");
          endTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
          
          // Se o fim for menor que o início (passou da meia noite)
          if (endTime < startTime) {
             endTime.setDate(endTime.getDate() + 1);
          }
        }

        const statusFinal = mapStatus(statusRaw);
        if (statusFinal === "RESOLVIDO" && !endTime) {
          endTime = new Date();
        }

        let totalTimeMinutes = null;
        if (startTime && endTime) {
           totalTimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
        }

        const ticket = await createTicket({
          requesterId: requesterId,
          requesterName: solicitanteNome,
          sectorId,
          technicianId,
          serviceId,
          problem: problema,
          description: descricao || undefined,
          status: statusFinal,
          origin: "MANUAL",
          priority: "MEDIA",
          ticketDate,
          startTime,
          endTime,
        }, session.id, session.name);

        importedCount++;
      } catch (err: any) {
        errors.push(`Erro na linha ${i + headerRowIndex + 2}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("[HelpDesk API] Erro ao importar planilha:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar a importação." },
      { status: 500 }
    );
  }
}
