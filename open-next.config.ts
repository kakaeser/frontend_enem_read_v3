import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Config padrão: sem cache incremental customizado, sem R2/KV.
  // O frontend fala com o backend via HTTPS (NEXT_PUBLIC_API_URL).
});
