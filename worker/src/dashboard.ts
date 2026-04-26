import { Env, json, requireAuth } from "./auth";

export async function handleDashboard(request: Request, env: Env): Promise<Response> {
  const authErr = await requireAuth(request, env);
  if (authErr) return authErr;

  if (request.method !== "GET") return json({ ok: false, error: "GET only" }, 405);

  const [
    carriersTotal,
    mvnoTotal,
    plansTotal,
    appsTotal,
    appsToday,
    appsWeek,
    noticesTotal,
    inquiriesTotal,
    inquiriesPending,
    appsByCarrier,
    recentApps,
  ] = await Promise.all([
    env.DB.prepare("SELECT count(*) as c FROM carriers WHERE parent_id IS NULL").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM carriers WHERE parent_id IS NOT NULL").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM plans").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM applications").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM applications WHERE created_at >= date('now')").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM applications WHERE created_at >= date('now', '-7 days')").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM notices WHERE is_active = 1").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM inquiries").first<{ c: number }>(),
    env.DB.prepare("SELECT count(*) as c FROM inquiries WHERE reply IS NULL").first<{ c: number }>(),
    env.DB.prepare("SELECT carrier_name, count(*) as cnt FROM applications GROUP BY carrier_name ORDER BY cnt DESC LIMIT 10").all(),
    env.DB.prepare("SELECT id, subscriber_name, carrier_name, plan_name, created_at FROM applications ORDER BY created_at DESC LIMIT 5").all(),
  ]);

  return json({
    ok: true,
    data: {
      carriers: carriersTotal?.c || 0,
      mvnos: mvnoTotal?.c || 0,
      plans: plansTotal?.c || 0,
      applications: {
        total: appsTotal?.c || 0,
        today: appsToday?.c || 0,
        week: appsWeek?.c || 0,
        byCarrier: appsByCarrier.results,
        recent: recentApps.results,
      },
      notices: noticesTotal?.c || 0,
      inquiries: {
        total: inquiriesTotal?.c || 0,
        pending: inquiriesPending?.c || 0,
      },
    },
  });
}
