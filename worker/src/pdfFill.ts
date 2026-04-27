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
  let positions: { key: string; xPt?: number; yPt?: number; x?: number; y?: number; fontSize: number; page: number }[] = [];
  try {
    const parsed = JSON.parse(carrier.form_fields);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.key) {
      positions = parsed;
    }
  } catch {}

  if (positions.length === 0) return json({ ok: false, error: "좌표 데이터가 없습니다" }, 400);

  // PDF를 R2에서 직접 가져오기
  const pdfKey = carrier.form_template.replace(/^https?:\/\/[^/]+\/r2\//, "");
  const pdfObj = await env.R2.get(pdfKey);
  if (!pdfObj) return json({ ok: false, error: "PDF 파일을 찾을 수 없습니다" }, 404);
  const pdfBytes = await pdfObj.arrayBuffer();

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

    // xPt/yPt가 있으면 PDF pt 좌표 직접 사용, 없으면 % 변환
    let x: number, y: number;
    if (pos.xPt !== undefined && pos.yPt !== undefined) {
      x = pos.xPt;
      y = pos.yPt;
    } else {
      x = ((pos.x || 0) / 100) * width;
      y = height - ((pos.y || 0) / 100) * height;
    }

    page.drawText(value, {
      x,
      y,
      size: pos.fontSize || 10,
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
