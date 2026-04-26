import { Env, createToken, json } from "./auth";
import { corsHeaders, handleOptions } from "./cors";
import { handleCarriers } from "./carriers";
import { handlePlans } from "./plans";
import { handleUpload, handleR2Get } from "./upload";
import { handleNotices } from "./notices";
import { handleInquiries } from "./inquiries";
import { handleCrawl } from "./crawl";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    try {
      if (path === "/api/auth/login" && request.method === "POST") {
        response = await handleLogin(request, env);
      } else if (path === "/api/upload") {
        response = await handleUpload(request, env);
      } else if (path.startsWith("/r2/")) {
        response = await handleR2Get(request, env, path);
      } else if (path.startsWith("/api/carriers")) {
        response = await handleCarriers(request, env, path);
      } else if (path === "/api/admin/crawl") {
        response = await handleCrawl(request, env);
      } else if (path.startsWith("/api/plans")) {
        response = await handlePlans(request, env, path);
      } else if (path.startsWith("/api/notices")) {
        response = await handleNotices(request, env, path);
      } else if (path.startsWith("/api/inquiries")) {
        response = await handleInquiries(request, env, path);
      } else {
        response = json({ ok: false, error: "Not found" }, 404);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      response = json({ ok: false, error: message }, 500);
    }

    const cors = corsHeaders(request);
    for (const [key, val] of Object.entries(cors)) {
      response.headers.set(key, val);
    }

    return response;
  },
};

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{ password?: string }>();
  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "비밀번호가 올바르지 않습니다" }, 401);
  }
  const token = await createToken(env);
  return json({ ok: true, data: { token } });
}
