import { NextResponse } from "next/server";
import { ensureInitialAdmin } from "@/services/auth/seed.service";

export async function GET() {
  try {
    const result = await ensureInitialAdmin();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[HelpDesk API] Erro ao semear admin:", error);
    return NextResponse.json({ created: false, error: error?.message || "Erro desconhecido" }, { status: 500 });
  }
}
