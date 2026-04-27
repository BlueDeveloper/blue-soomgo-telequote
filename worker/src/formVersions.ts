import { Env, json, requireAuth } from "./auth";

export async function handleFormVersions(request: Request, env: Env, path: string): Promise<Response> {
  const authErr = await requireAuth(request, env);
  if (authErr) return authErr;

  const parts = path.replace("/api/form-versions", "").split("/").filter(Boolean);

  // GET /api/form-versions?carrier=xxx — 해당 MVNO의 버전 목록
  if (request.method === "GET" && parts.length === 0) {
    const url = new URL(request.url);
    const carrierId = url.searchParams.get("carrier");
    if (!carrierId) return json({ ok: false, error: "carrier 파라미터 필수" }, 400);

    const result = await env.DB.prepare(
      "SELECT * FROM form_versions WHERE carrier_id = ? ORDER BY version DESC"
    ).bind(carrierId).all();
    return json({ ok: true, data: result.results });
  }

  // POST /api/form-versions — 새 버전 생성
  if (request.method === "POST" && parts.length === 0) {
    const { carrierId, label, pages } = await request.json<{
      carrierId: string; label: string; pages: string[];
    }>();
    if (!carrierId || !pages || pages.length === 0) {
      return json({ ok: false, error: "carrierId와 pages는 필수입니다" }, 400);
    }

    // 다음 버전 번호
    const last = await env.DB.prepare(
      "SELECT MAX(version) as v FROM form_versions WHERE carrier_id = ?"
    ).bind(carrierId).first<{ v: number | null }>();
    const nextVersion = (last?.v || 0) + 1;

    // 새 버전 생성 (비활성)
    const result = await env.DB.prepare(
      "INSERT INTO form_versions (carrier_id, version, label, pages, is_active) VALUES (?, ?, ?, ?, 0)"
    ).bind(carrierId, nextVersion, label || `v${nextVersion}`, JSON.stringify(pages)).run();

    return json({ ok: true, data: { id: result.meta.last_row_id, version: nextVersion } }, 201);
  }

  // PUT /api/form-versions/:id/activate — 활성 버전 변경
  if (request.method === "PUT" && parts.length === 2 && parts[1] === "activate") {
    const id = parts[0];

    // 해당 버전 확인
    const ver = await env.DB.prepare("SELECT * FROM form_versions WHERE id = ?").bind(id).first<{ carrier_id: string; pages: string }>();
    if (!ver) return json({ ok: false, error: "버전을 찾을 수 없습니다" }, 404);

    // 같은 carrier의 모든 버전 비활성
    await env.DB.prepare("UPDATE form_versions SET is_active = 0 WHERE carrier_id = ?").bind(ver.carrier_id).run();

    // 선택한 버전 활성
    await env.DB.prepare("UPDATE form_versions SET is_active = 1 WHERE id = ?").bind(id).run();

    // carriers 테이블에도 반영
    const pages = JSON.parse(ver.pages) as string[];
    await env.DB.prepare(
      "UPDATE carriers SET form_template = ?, form_fields = ? WHERE id = ?"
    ).bind(pages[0] || null, ver.pages, ver.carrier_id).run();

    return json({ ok: true });
  }

  // DELETE /api/form-versions/:id
  if (request.method === "DELETE" && parts.length === 1) {
    await env.DB.prepare("DELETE FROM form_versions WHERE id = ?").bind(parts[0]).run();
    return json({ ok: true });
  }

  return json({ ok: false, error: "Not found" }, 404);
}
