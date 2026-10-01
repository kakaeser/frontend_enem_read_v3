/** Espelha `normalizeConsultaCode` do backend (trim, sem hífen, uppercase). */
export function normalizeConsultaCode(input: string): string {
  return input.trim().replace(/-/g, "").toUpperCase()
}
