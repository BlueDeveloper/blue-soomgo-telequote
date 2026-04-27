"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarrierTree, fetchFormVersions, updateCarrier } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

interface FieldPos {
  key: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  page: number;
}

function EditorContent() {
  const { toast, showLoading, hideLoading } = useToast();
  const searchParams = useSearchParams();
  const initCarrier = searchParams.get("carrier") || "";
  const router = useRouter();

  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMvno, setSelectedMvno] = useState(initCarrier);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fields, setFields] = useState<{ key: string; label: string }[]>([]);
  const [positions, setPositions] = useState<FieldPos[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [placingField, setPlacingField] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);

  const allMvnos = tree.flatMap(m => m.children || []);

  // 1. 트리 로드
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    fetchCarrierTree(false).then(setTree);
  }, [router]);

  // 2. MVNO 선택 시 데이터 로드
  useEffect(() => {
    if (!selectedMvno || tree.length === 0) return;
    const m = allMvnos.find(c => c.id === selectedMvno);
    if (!m) return;

    // PDF URL
    const url = m.form_template || "";
    setPdfUrl(url);
    setPdfReady(false);
    pdfDocRef.current = null;
    setCurrentPage(1);
    setTotalPages(0);

    // 필드 목록
    try {
      const cfg = m.form_config ? JSON.parse(m.form_config) : [];
      setFields(cfg.map((f: { key: string; label: string }) => ({ key: f.key, label: f.label })));
    } catch {
      setFields([
        { key: "subscriberName", label: "가입자명" },
        { key: "birthDate", label: "생년월일" },
        { key: "contactNumber", label: "연락처" },
        { key: "customerType", label: "고객유형" },
        { key: "idNumber", label: "신분증번호" },
        { key: "address", label: "주소" },
        { key: "activationType", label: "개통구분" },
        { key: "usimSerial", label: "USIM" },
        { key: "desiredNumber", label: "희망번호" },
        { key: "storeName", label: "판매점명" },
      ]);
    }

    // 좌표 데이터
    setPositions([]);
    if (m.form_fields) {
      try {
        const parsed = JSON.parse(m.form_fields);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.key) {
          setPositions(parsed);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMvno, tree]);

  // 3. PDF 렌더링
  useEffect(() => {
    if (!pdfUrl || !pdfUrl.endsWith(".pdf") || !canvasRef.current) return;

    const render = async () => {
      showLoading("PDF 로딩 중...");
      try {
        // PDF.js 로드
        if (!(window as unknown as Record<string, unknown>).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.type = "module";
            s.textContent = `import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';window.pdfjsLib=m;window.dispatchEvent(new Event('pdfjsReady'));});`;
            document.head.appendChild(s);
            const h = () => { window.removeEventListener("pdfjsReady", h); resolve(); };
            window.addEventListener("pdfjsReady", h);
            setTimeout(reject, 15000);
          });
        }

        const lib = (window as unknown as Record<string, unknown>).pdfjsLib as Record<string, unknown>;
        if (!pdfDocRef.current) {
          pdfDocRef.current = await (lib.getDocument as Function)({ url: pdfUrl }).promise;
        }

        const doc = pdfDocRef.current as { numPages: number; getPage: (n: number) => Promise<Record<string, unknown>> };
        setTotalPages(doc.numPages);

        const page = await doc.getPage(currentPage);
        const containerWidth = containerRef.current?.clientWidth || 800;
        const baseVp = (page.getViewport as Function)({ scale: 1 });
        const scale = containerWidth / baseVp.width;
        const vp = (page.getViewport as Function)({ scale });

        const canvas = canvasRef.current!;
        canvas.width = vp.width;
        canvas.height = vp.height;
        await (page.render as Function)({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
        setPdfReady(true);
      } catch (e) {
        console.error("PDF render error:", e);
        toast("PDF 렌더링 실패", "error");
      }
      hideLoading();
    };

    render();
  }, [pdfUrl, currentPage, showLoading, hideLoading, toast]);

  // 캔버스 클릭
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingField || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const field = fields.find(f => f.key === placingField);

    setPositions(prev => [
      ...prev.filter(p => p.key !== placingField),
      { key: placingField, label: field?.label || placingField, x, y, fontSize: 12, page: currentPage },
    ]);
    toast(`"${field?.label}" 배치 완료`, "success");
    setPlacingField(null);
  };

  // 드래그
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPositions(prev => prev.map(p => p.key === dragging ? { ...p, x, y } : p));
  };

  // 저장
  const handleSave = async () => {
    setSaving(true);
    await updateCarrier(selectedMvno, { form_fields: JSON.stringify(positions) } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("좌표 저장 완료", "success");
  };

  const pagePositions = positions.filter(p => p.page === currentPage);
  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <a href="/" className={styles.sidebarLogo} style={{ textDecoration: "none", color: "inherit" }}><span className={styles.sidebarLogoIcon}>H</span>관리자</a>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.sidebarLink}>📊 대시보드</Link>
          <Link href="/admin/form-settings" className={styles.sidebarLink}>📝 신청서설정</Link>
          <Link href="/admin/form-editor" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>🎯 좌표에디터</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>좌표 에디터</h1>
          <button className={styles.addBtn} onClick={handleSave} disabled={saving || !selectedMvno}>
            {saving ? "저장 중..." : "💾 좌표 저장"}
          </button>
        </div>

        {/* 통신사 + 페이지 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>통신사</label>
            <select style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }}
              value={selectedMvno} onChange={e => setSelectedMvno(e.target.value)}>
              <option value="" disabled>선택하세요</option>
              {allMvnos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => { pdfDocRef.current && setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage <= 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>◀</button>
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: "center" }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>▶</button>
            </div>
          )}
        </div>

        {/* 배치 모드 안내 */}
        {placingField && (
          <div style={{ padding: "12px 20px", marginBottom: 12, background: "#DC2626", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
            🎯 PDF 위에서 &quot;{fields.find(f => f.key === placingField)?.label}&quot; 위치를 클릭하세요
            <button onClick={() => setPlacingField(null)} style={{ marginLeft: 12, padding: "4px 12px", background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>취소</button>
          </div>
        )}

        {!pdfUrl ? (
          <div className={styles.empty}>
            {selectedMvno ? <>양식 PDF를 먼저 업로드하세요. <Link href="/admin/form-settings" style={{ color: "var(--brand)" }}>신청서 설정 →</Link></> : "통신사를 선택하세요."}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* 좌측: PDF + 오버레이 */}
            <div ref={containerRef} style={{ flex: 1, position: "relative", background: "#F1F5F9", borderRadius: 12, overflow: "hidden", border: "1px solid #E8ECF1", minHeight: 400 }}
              onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}>
              <canvas ref={canvasRef} onClick={handleCanvasClick}
                style={{ width: "100%", display: "block", cursor: placingField ? "crosshair" : "default" }} />

              {/* 배치된 필드 */}
              {pdfReady && pagePositions.map(p => (
                <div key={p.key}
                  onMouseDown={e => { e.preventDefault(); setDragging(p.key); }}
                  style={{
                    position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)",
                    padding: "3px 10px", background: "rgba(37,99,235,0.9)", color: "white", borderRadius: 4,
                    fontSize: 11, fontWeight: 700, cursor: dragging === p.key ? "grabbing" : "grab",
                    whiteSpace: "nowrap", userSelect: "none", zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}>
                  {p.label} <span style={{ fontSize: 9, opacity: 0.7 }}>{p.fontSize}px</span>
                </div>
              ))}

              {!pdfReady && pdfUrl && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 14 }}>
                  PDF 로딩 중...
                </div>
              )}
            </div>

            {/* 우측: 필드 패널 */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-0)", marginBottom: 8 }}>필드 배치</h3>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>클릭 → PDF 위 위치 클릭 → 드래그로 조정</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {fields.map(f => {
                    const placed = positions.find(p => p.key === f.key);
                    const isPlacing = placingField === f.key;
                    return (
                      <div key={f.key} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8,
                        background: isPlacing ? "#FEF2F2" : placed ? "#EFF6FF" : "#F8FAFC",
                        border: isPlacing ? "2px solid #DC2626" : placed ? "1px solid #BFDBFE" : "1px solid #E8ECF1",
                      }}>
                        <button onClick={() => {
                          const next = isPlacing ? null : f.key;
                          setPlacingField(next);
                          if (next) toast(`"${f.label}" — PDF에서 위치 클릭`, "info");
                        }} style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600, color: isPlacing ? "#DC2626" : placed ? "var(--brand)" : "var(--text-1)", cursor: "pointer" }}>
                          {isPlacing ? "🎯 " : placed ? "✓ " : "○ "}{f.label}
                        </button>
                        {placed && (
                          <>
                            <input type="number" value={placed.fontSize} onChange={e => setPositions(prev => prev.map(p => p.key === f.key ? { ...p, fontSize: Number(e.target.value) } : p))}
                              style={{ width: 36, padding: "2px 4px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 11, textAlign: "center" }} title="px" />
                            <button onClick={() => setPositions(prev => prev.filter(p => p.key !== f.key))} style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>
                  배치됨: {positions.length}/{fields.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FormEditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>불러오는 중...</div>}>
      <EditorContent />
    </Suspense>
  );
}
