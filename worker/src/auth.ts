export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
}

async function sign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(payload, secret);
  return expected === signature;
}

export async function createToken(env: Env): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + 24 * 60 * 60 * 1000 });
  const b64 = btoa(payload);
  const sig = await sign(b64, env.JWT_SECRET);
  return `${b64}.${sig}`;
}

export async function verifyToken(token: string, env: Env): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [b64, sig] = parts;
  const valid = await verify(b64, sig, env.JWT_SECRET);
  if (!valid) return false;

  try {
    const payload = JSON.parse(atob(b64));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAuth(request: Request, env: Env): Promise<Response | null> {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return json({ ok: false, error: "인증이 필요합니다" }, 401);
  }

  const token = auth.slice(7);
  const valid = await verifyToken(token, env);
  if (!valid) {
    return json({ ok: false, error: "토큰이 만료되었거나 유효하지 않습니다" }, 401);
  }

  return null; // 인증 성공
}

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
