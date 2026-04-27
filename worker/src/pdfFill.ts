import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Env, json, requireAuth } from "./auth";

// 한글 폰트가 없으므로 Helvetica로 대체 (한글은 깨짐 주의)
// TODO: 한글 폰트 임베딩 필요 시 fontkit 사용

export async function handlePdfFill(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const body = await request.json<{
    carrierId: string;
    values: Record<string, string>;
  }>();

  const { carrierId, values } = body;
  if (!carrierId) return json({ ok: false, error: "carrierId 필수" }, 400);

  // 통신사 정보 가져오기
  const carrier = await env.DB.prepare("SELECT form_template, form_fields FROM carriers WHERE id = ?").bind(carrierId).first<{ form_template: string; form_fields: string }>();
  if (!carrier?.form_template) return json({ ok: false, error: "양식이 등록되지 않았습니다" }, 404);

  // 좌표 데이터 파싱
  let positions: { key: string; x: number; y: number; fontSize: number; page: number }[] = [];
  try {
    const parsed = JSON.parse(carrier.form_fields);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.key) {
      positions = parsed;
    }
  } catch {}

  if (positions.length === 0) return json({ ok: false, error: "좌표 데이터가 없습니다" }, 400);

  // PDF 다운로드
  const pdfRes = await fetch(carrier.form_template);
  if (!pdfRes.ok) return json({ ok: false, error: "PDF 다운로드 실패" }, 500);
  const pdfBytes = await pdfRes.arrayBuffer();

  // PDF 수정
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const pos of positions) {
    const pageIdx = (pos.page || 1) - 1;
    if (pageIdx < 0 || pageIdx >= pages.length) continue;

    const page = pages[pageIdx];
    const { width, height } = page.getSize();
    const value = values[pos.key] || "";
    if (!value) continue;

    // % 좌표 → PDF 좌표 변환
    // 에디터의 좌표는 좌상단 기준 %, PDF는 좌하단 기준 pt
    const x = (pos.x / 100) * width;
    const y = height - (pos.y / 100) * height;

    page.drawText(value, {
      x: x - (value.length * (pos.fontSize || 12) * 0.3), // 대략적 중앙 정렬
      y: y - (pos.fontSize || 12) / 2,
      size: pos.fontSize || 12,
      font,
      color: rgb(0, 0, 0),
    });
  }

  const filledBytes = await pdfDoc.save();

  return new Response(filledBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=filled_form.pdf",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
