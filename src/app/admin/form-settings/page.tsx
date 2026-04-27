"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarrierTree, updateCarrier, uploadImage, fetchFormVersions, createFormVersion, activateFormVersion, deleteFormVersion, deleteAllFormVersions } from "@/lib/api";
import type { FormVersion } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

// PDF.js
async function loadPdfJs(): Promise<unknown> {
  if ((window as unknown as Record<string, unknown>).pdfjsLib) return (window as unknown as Record<string, unknown>).pdfjsLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.textContent = `import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';window.pdfjsLib=m;window.dispatchEvent(new Event('pdfjsReady'));});`;
    document.head.appendChild(s);
    const h = () => { window.removeEventListener("pdfjsReady", h); resolve((window as unknown as Record<string, unknown>).pdfjsLib); };
    window.addEventListener("pdfjsReady", h);
    setTimeout(reject, 15000);
  });
}

interface FormField { key: string; label: string; type: "text" | "phone" | "date" | "select" | "address"; required: boolean; options?: string[]; }
interface FieldPos { key: string; label: string; xPt: number; yPt: number; fontSize: number; page: number; }

const DEFAULT_FIELDS: FormField[] = [
  { key: "usimSerial", label: "USIM 일련번호", type: "text", required: false },
  { key: "customerType", label: "고객유형", type: "select", required: true, options: ["개인","외국인","청소년","개인사업자","법인사업자"] },
  { key: "subscriberName", label: "가입자명", type: "text", required: true },
  { key: "contactNumber", label: "개통번호/연락번호", type: "phone", required: true },
  { key: "birthDate", label: "생년월일", type: "date", required: true },
  { key: "idNumber", label: "신분증번호/여권번호", type: "text", required: false },
  { key: "nationality", label: "국적", type: "text", required: false },
  { key: "address", label: "주소", type: "address", required: false },
  { key: "addressDetail", label: "상세주소", type: "text", required: false },
  { key: "activationType", label: "개통구분", type: "select", required: true, options: ["신규가입","번호이동","기기변경"] },
  { key: "desiredNumber", label: "희망번호", type: "text", required: false },
  { key: "storeName", label: "판매점명", type: "text", required: false },
];

export default function FormSettingsPage() {
  const { toast, showLoading, hideLoading } = useToast();
  const [tab, setTab] = useState<"settings" | "editor">("settings");
  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMvno, setSelectedMvno] = useState("");
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState("");
  const [upgradePages, setUpgradePages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 좌표 에디터 상태
  const [positions, setPositions] = useState<FieldPos[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);
  const [placingField, setPlacingField] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);

  const router = useRouter();
  const allMvnos = tree.flatMap(m => m.children || []);
  const pdfUrl = allMvnos.find(m => m.id === selectedMvno)?.form_template || "";

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchCarrierTree(false);
    setTree(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // MVNO 선택 시
  useEffect(() => {
    if (!selectedMvno || tree.length === 0) return;
    const mvno = tree.flatMap(m => m.children || []).find(m => m.id === selectedMvno);
    if (!mvno) return;

    try { setFields(mvno.form_config ? JSON.parse(mvno.form_config) : DEFAULT_FIELDS); } catch { setFields(DEFAULT_FIELDS); }
    try { setPreviewPages(mvno.form_fields ? JSON.parse(mvno.form_fields).filter?.((p: unknown) => typeof p === "string") || [] : []); } catch { setPreviewPages([]); }
    setPreviewIdx(0);
    fetchFormVersions(selectedMvno).then(setVersions);

    // 좌표 데이터
    setPositions([]);
    if (mvno.form_fields) {
      try {
        const parsed = JSON.parse(mvno.form_fields);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.key && parsed[0]?.xPt !== undefined) {
          setPositions(parsed);
        }
      } catch {}
    }
    pdfDocRef.current = null;
    setCurrentPage(1);
    setTotalPages(0);
  }, [selectedMvno, tree]);

  // 좌표 에디터: PDF canvas 렌더링
  useEffect(() => {
    if (tab !== "editor" || !pdfUrl || !pdfUrl.endsWith(".pdf") || !canvasRef.current) return;
    const render = async () => {
      showLoading("PDF 렌더링 중...");
      try {
        const lib = await loadPdfJs() as { getDocument: Function };
        if (!pdfDocRef.current) pdfDocRef.current = await lib.getDocument({ url: pdfUrl }).promise;
        const doc = pdfDocRef.current as { numPages: number; getPage: (n: number) => Promise<Record<string, Function>> };
        setTotalPages(doc.numPages);
        const page = await doc.getPage(currentPage);
        const baseVp = page.getViewport({ scale: 1 });
        setPageWidth(baseVp.width);
        setPageHeight(baseVp.height);
        const containerWidth = containerRef.current?.clientWidth || 700;
        const scale = containerWidth / baseVp.width;
        const vp = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
      } catch (e) { console.error(e); }
      hideLoading();
    };
    render();
  }, [tab, pdfUrl, currentPage, showLoading, hideLoading]);

  const handleSaveFields = async () => {
    if (!selectedMvno) return;
    setSaving(true);
    await updateCarrier(selectedMvno, { form_config: JSON.stringify(fields) } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("항목 설정 저장 완료", "success");
  };

  const handleSavePositions = async () => {
    if (!selectedMvno) return;
    setSaving(true);
    await updateCarrier(selectedMvno, { form_fields: JSON.stringify(positions) } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("좌표 저장 완료", "success");
  };

  const handleUploadFile = async (file: File) => {
    showLoading("업로드 중...");
    try {
      const fd = new FormData(); fd.append("file", file);
      const token = sessionStorage.getItem("admin_token");
      const API = process.env.NEXT_PUBLIC_API_URL || "https://hlmobile-api.blueehdwp.workers.dev";
      const res = await fetch(`${API}/api/upload`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      const j = await res.json() as { ok: boolean; data?: { url: string }; error?: string };
      if (j.ok && j.data) { setUpgradePages([j.data.url]); toast("업로드 완료", "success"); }
      else toast(j.error || "업로드 실패", "error");
    } catch { toast("업로드 실패", "error"); }
    hideLoading();
  };

  const handleCreateVersion = async () => {
    if (upgradePages.length === 0) { toast("양식을 업로드해주세요.", "error"); return; }
    setSaving(true);
    const url = upgradePages[0];
    const isPdf = url.endsWith(".pdf");
    const res = await createFormVersion(selectedMvno, upgradeLabel || "", isPdf ? undefined : upgradePages, isPdf ? url : undefined);
    if (res.ok && res.data) {
      await activateFormVersion(res.data.id);
      toast(`v${res.data.version} 생성 및 활성화`, "success");
      fetchFormVersions(selectedMvno).then(setVersions);
      load();
    }
    setSaving(false);
    setUpgradeModal(false);
    setUpgradePages([]);
    setUpgradeLabel("");
  };

  const handleActivate = async (id: number, ver: number) => { await activateFormVersion(id); toast(`v${ver} 활성화`, "success"); fetchFormVersions(selectedMvno).then(setVersions); load(); };
  const handleDeleteVersion = async (id: number, ver: number) => { if (!confirm(`v${ver} 삭제?`)) return; showLoading("삭제 중..."); await deleteFormVersion(id); hideLoading(); toast(`v${ver} 삭제`, "success"); fetchFormVersions(selectedMvno).then(setVersions); load(); };
  const handleDeleteAll = async () => { if (!confirm("전체 양식 삭제?")) return; showLoading("삭제 중..."); await deleteAllFormVersions(selectedMvno); setVersions([]); setPreviewPages([]); hideLoading(); toast("전체 삭제 완료", "success"); load(); };

  // 좌표 에디터 핸들러
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingField || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPt = ((e.clientX - rect.left) / rect.width) * pageWidth;
    const yPt = pageHeight - ((e.clientY - rect.top) / rect.height) * pageHeight;
    const field = fields.find(f => f.key === placingField);
    setPositions(prev => [...prev.filter(p => p.key !== placingField), { key: placingField, label: field?.label || placingField, xPt, yPt, fontSize: 10, page: currentPage }]);
    toast(`"${field?.label}" 배치 완료`, "success");
    setPlacingField(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPt = Math.max(0, Math.min(pageWidth, ((e.clientX - rect.left) / rect.width) * pageWidth));
    const yPt = Math.max(0, Math.min(pageHeight, pageHeight - ((e.clientY - rect.top) / rect.height) * pageHeight));
    setPositions(prev => prev.map(p => p.key === dragging ? { ...p, xPt, yPt } : p));
  };

  const ptToPercent = (xPt: number, yPt: number) => ({ left: `${(xPt / pageWidth) * 100}%`, top: `${((pageHeight - yPt) / pageHeight) * 100}%` });
  const pagePositions = positions.filter(p => p.page === currentPage);
  const activeVersion = versions.find(v => v.is_active);

  const toggleRequired = (i: number) => setFields(p => p.map((f, idx) => idx === i ? { ...f, required: !f.required } : f));
  const removeField = (i: number) => setFields(p => p.filter((_, idx) => idx !== i));
  const addField = () => setFields(p => [...p, { key: `custom_${Date.now()}`, label: "새 항목", type: "text", required: false }]);
  const updateField = (i: number, u: Partial<FormField>) => setFields(p => p.map((f, idx) => idx === i ? { ...f, ...u } : f));
  const moveField = (i: number, d: -1 | 1) => { const ni = i + d; if (ni < 0 || ni >= fields.length) return; setFields(p => { const a = [...p]; [a[i], a[ni]] = [a[ni], a[i]]; return a; }); };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <a href="/" className={styles.sidebarLogo} style={{ textDecoration: "none", color: "inherit" }}><span className={styles.sidebarLogoIcon}>H</span>관리자</a>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.sidebarLink}>📊 대시보드</Link>
          <Link href="/admin/carriers" className={styles.sidebarLink}>📱 통신사</Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>💰 요금제</Link>
          <Link href="/admin/applications" className={styles.sidebarLink}>📋 신청서</Link>
          <Link href="/admin/form-settings" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>📝 신청서설정</Link>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>신청서 설정</h1>
        </div>

        {/* MVNO 선택 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>통신사</label>
            <select style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }}
              value={selectedMvno} onChange={e => { setSelectedMvno(e.target.value); pdfDocRef.current = null; }}>
              <option value="" disabled>선택하세요</option>
              {allMvnos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : selectedMvno && (
          <>
            {/* 탭 */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "white", borderRadius: 12, border: "1px solid #E8ECF1", overflow: "hidden" }}>
              {[
                { key: "settings" as const, label: "📋 양식 버전 & 항목" },
                { key: "editor" as const, label: "🎯 좌표 에디터" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flex: 1, padding: "14px", fontSize: 14, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "var(--brand)" : "var(--text-3)", background: tab === t.key ? "var(--brand-light)" : "white", border: "none", cursor: "pointer", borderRight: "1px solid #E8ECF1" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 설정 탭 */}
            {tab === "settings" && (
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* 양식 버전 */}
                <div style={{ flex: "1 1 400px" }}>
                  <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>양식 버전</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        {versions.length > 0 && <button onClick={handleDeleteAll} style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #FECACA" }}>🗑️ 전체 삭제</button>}
                        <button onClick={() => { setUpgradeModal(true); setUpgradePages([]); setUpgradeLabel(""); }} style={{ padding: "8px 16px", background: "var(--brand)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⬆️ 업그레이드</button>
                      </div>
                    </div>
                    {activeVersion ? (
                      <div style={{ padding: 14, background: "#EFF6FF", borderRadius: 10, border: "1px solid #BFDBFE", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div><span style={{ fontSize: 16, fontWeight: 900, color: "var(--brand)" }}>v{activeVersion.version}</span>{activeVersion.label && <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-2)" }}>{activeVersion.label}</span>}<span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#DBEAFE", color: "#1D4ED8" }}>활성</span></div>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{activeVersion.created_at?.slice(0, 10)}</span>
                      </div>
                    ) : <div style={{ padding: 20, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>양식을 업로드하세요.</div>}
                    {versions.map(v => (
                      <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: "1px solid #F1F5F9", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: v.is_active ? "var(--brand)" : "var(--text-2)" }}>v{v.version} {v.label && <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>{v.label}</span>}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!v.is_active && <button onClick={() => handleActivate(v.id, v.version)} style={{ padding: "3px 8px", background: "#EFF6FF", color: "var(--brand)", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>사용</button>}
                          {!v.is_active && <button onClick={() => handleDeleteVersion(v.id, v.version)} style={{ padding: "3px 8px", background: "#FEF2F2", color: "#DC2626", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>삭제</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 항목 설정 */}
                <div style={{ flex: "1 1 400px" }}>
                  <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>신청서 항목</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={addField} style={{ padding: "8px 12px", background: "#F1F5F9", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 추가</button>
                        <button onClick={handleSaveFields} disabled={saving} style={{ padding: "8px 12px", background: "var(--brand)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{saving ? "저장 중..." : "💾 저장"}</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {fields.map((f, i) => (
                        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "#FAFBFD", borderRadius: 8, border: "1px solid #E8ECF1", fontSize: 13 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}><button onClick={() => moveField(i, -1)} style={{ fontSize: 9, cursor: "pointer", color: "var(--text-3)" }}>▲</button><button onClick={() => moveField(i, 1)} style={{ fontSize: 9, cursor: "pointer", color: "var(--text-3)" }}>▼</button></div>
                          <button onClick={() => toggleRequired(i)} style={{ width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: "pointer", background: f.required ? "var(--brand)" : "#E2E8F0", color: f.required ? "white" : "var(--text-3)" }}>{f.required ? "✓" : ""}</button>
                          <input value={f.label} onChange={e => updateField(i, { label: e.target.value })} style={{ flex: 1, padding: "5px 8px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 13, outline: "none" }} />
                          <select value={f.type} onChange={e => updateField(i, { type: e.target.value as FormField["type"] })} style={{ padding: "5px 6px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 11 }}><option value="text">텍스트</option><option value="phone">전화</option><option value="date">날짜</option><option value="select">선택</option><option value="address">주소</option></select>
                          {f.type === "select" && <input value={f.options?.join(",") || ""} onChange={e => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="옵션" style={{ width: 100, padding: "5px 6px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 11 }} />}
                          <span style={{ fontSize: 10, fontWeight: 700, color: f.required ? "var(--brand)" : "var(--text-3)" }}>{f.required ? "필수" : "선택"}</span>
                          <button onClick={() => removeField(i)} style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 좌표 에디터 탭 */}
            {tab === "editor" && (
              <>
                {!pdfUrl ? <div className={styles.empty}>양식 PDF를 먼저 업로드하세요.</div> : (
                  <>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                      {totalPages > 1 && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>◀</button>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{currentPage}/{totalPages}</span>
                          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>▶</button>
                        </div>
                      )}
                      <button onClick={handleSavePositions} disabled={saving} style={{ padding: "8px 16px", background: "var(--brand)", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{saving ? "저장 중..." : "💾 좌표 저장"}</button>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>배치: {positions.length}/{fields.length} · * 폰트 깨져도 좌표만 맞으면 OK</span>
                    </div>

                    {placingField && (
                      <div style={{ padding: "10px 16px", marginBottom: 10, background: "#DC2626", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                        🎯 &quot;{fields.find(f => f.key === placingField)?.label}&quot; 위치를 클릭
                        <button onClick={() => setPlacingField(null)} style={{ marginLeft: 10, padding: "3px 10px", background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>취소</button>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div ref={containerRef} style={{ flex: 1, position: "relative", background: "#F1F5F9", borderRadius: 10, overflow: "hidden", border: "1px solid #E8ECF1" }}
                        onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}>
                        <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: "100%", display: "block", cursor: placingField ? "crosshair" : "default" }} />
                        {pagePositions.map(p => { const pos = ptToPercent(p.xPt, p.yPt); return (
                          <div key={p.key} onMouseDown={e => { e.preventDefault(); setDragging(p.key); }}
                            style={{ position: "absolute", left: pos.left, top: pos.top, transform: "translate(-50%, -50%)", padding: "2px 8px", background: "rgba(37,99,235,0.9)", color: "white", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: dragging === p.key ? "grabbing" : "grab", whiteSpace: "nowrap", userSelect: "none", zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                            {p.label} {p.fontSize}pt
                          </div>
                        ); })}
                      </div>

                      <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 20, alignSelf: "flex-start", background: "white", borderRadius: 10, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>필드 배치</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {fields.map(f => {
                            const placed = positions.find(p => p.key === f.key);
                            const isP = placingField === f.key;
                            return (
                              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: 6, background: isP ? "#FEF2F2" : placed ? "#EFF6FF" : "#F8FAFC", border: isP ? "2px solid #DC2626" : placed ? "1px solid #BFDBFE" : "1px solid #E8ECF1" }}>
                                <button onClick={() => { setPlacingField(isP ? null : f.key); if (!isP) toast(`"${f.label}" 클릭`, "info"); }}
                                  style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 600, color: isP ? "#DC2626" : placed ? "var(--brand)" : "var(--text-1)", cursor: "pointer" }}>
                                  {isP ? "🎯" : placed ? "✓" : "○"} {f.label}
                                </button>
                                {placed && <>
                                  <input type="number" value={placed.fontSize} onChange={e => setPositions(prev => prev.map(p => p.key === f.key ? { ...p, fontSize: Number(e.target.value) } : p))} style={{ width: 32, padding: "1px 3px", border: "1px solid #E2E8F0", borderRadius: 3, fontSize: 10, textAlign: "center" }} />
                                  <button onClick={() => setPositions(prev => prev.filter(p => p.key !== f.key))} style={{ fontSize: 11, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                                </>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* 업그레이드 모달 */}
        {upgradeModal && (
          <div className={styles.overlay} onClick={() => setUpgradeModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}><h2 className={styles.modalTitle}>양식 버전 업그레이드</h2><button className={styles.modalClose} onClick={() => setUpgradeModal(false)}>✕</button></div>
              <div className={styles.formGroup}><label className={styles.formLabel}>버전 메모</label><input className={styles.formInput} value={upgradeLabel} onChange={e => setUpgradeLabel(e.target.value)} placeholder="예: 26년 4월 양식" /></div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>양식 파일</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <label style={{ padding: "12px 20px", background: "#FEF3C7", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#92400E", border: "2px solid #FDE68A" }}>📄 PDF<input type="file" accept=".pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} /></label>
                  <label style={{ padding: "12px 20px", background: "#F8FAFC", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text-1)", border: "2px solid #E8ECF1" }}>🖼️ 이미지<input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} /></label>
                </div>
              </div>
              {upgradePages.length > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>✓ 업로드 완료</div>}
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setUpgradeModal(false)}>취소</button>
                <button className={styles.saveBtn} onClick={handleCreateVersion} disabled={upgradePages.length === 0 || saving}>{saving ? "생성 중..." : `v${(versions[0]?.version || 0) + 1} 생성`}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
