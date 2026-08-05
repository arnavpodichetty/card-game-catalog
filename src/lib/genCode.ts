// genCode.ts — 4-letter room code (no I/O to avoid ambiguity).
export function genCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
