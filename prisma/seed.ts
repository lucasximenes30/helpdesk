import "dotenv/config";
import { ensureInitialAdmin } from "../services/auth/seed.service";

async function main() {
  console.log("[Seed] Verificando e semeando ADMIN inicial...");
  const result = await ensureInitialAdmin();
  console.log("[Seed] Resultado:", result);
}

main()
  .catch((e) => {
    console.error("[Seed] Erro no seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
