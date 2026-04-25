import { Env, json, requireAuth } from "./auth";

export async function handleCarriers(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  const id = path.replace("/api/carriers", "").replace(/^\//, "") || null;

  if (request.method === "GET") {
    return id ? getCarrier(env, id) : listCarriers(env, request);
  }

  // 인증 필요
  const authErr = await requireAuth(request, env);
  if (authErr) return authErr;

  if (request.method === "POST" && !id) return createCarrier(env, request);
  if (request.method === "PUT" && id) return updateCarrier(env, id, request);
  if (request.method === "DELETE" && id) return deleteCarrier(env, id);

  return json({ ok: false, error: "Method not allowed" }, 405);
}

async function listCarriers(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get("active") !== "0";

  const query = activeOnly
    ? "SELECT * FROM carriers WHERE is_active = 1 ORDER BY sort_order ASC"
    : "SELECT * FROM carriers ORDER BY sort_order ASC";

  const result = await env.DB.prepare(query).all();
  return json({ ok: true, data: result.results });
}

async function getCarrier(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare("SELECT * FROM carriers WHERE id = ?").bind(id).first();
  if (!row) return json({ ok: false, error: "통신사를 찾을 수 없습니다" }, 404);
  return json({ ok: true, data: row });
}

async function createCarrier(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Record<string, unknown>>();
  const { id, icon, iconStyle, title, description, forms, sortOrder } = body as {
    id: string; icon: string; iconStyle: string; title: string;
    description: string; forms: string; sortOrder: number;
  };

  if (!id || !title) return json({ ok: false, error: "id와 title은 필수입니다" }, 400);

  await env.DB.prepare(
    `INSERT INTO carriers (id, icon, icon_style, title, description, forms, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, icon || "📱", iconStyle || "serviceIconBlue", title, description || "", forms || "", sortOrder || 0).run();

  return json({ ok: true, data: { id } }, 201);
}

async function updateCarrier(env: Env, id: string, request: Request): Promise<Response> {
  const body = await request.json<Record<string, unknown>>();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(body)) {
    const col = key === "iconStyle" ? "icon_style" : key === "sortOrder" ? "sort_order" : key === "isActive" ? "is_active" : key;
    if (["icon", "icon_style", "title", "description", "forms", "sort_order", "is_active"].includes(col)) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return json({ ok: false, error: "수정할 필드가 없습니다" }, 400);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  await env.DB.prepare(`UPDATE carriers SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ ok: true });
}

async function deleteCarrier(env: Env, id: string): Promise<Response> {
  await env.DB.prepare("DELETE FROM plans WHERE carrier_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM carriers WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
