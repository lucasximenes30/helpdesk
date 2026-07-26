import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        slaHours: true,
      },
    });

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao listar serviços", details: error.message },
      { status: 500 }
    );
  }
}
