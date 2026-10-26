// Geen "server-only": dit wordt ook in proxy.ts gebruikt, dat buiten de
// normale React-serverboom draait.
export function onderhoudActief(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}
