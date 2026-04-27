"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarrierTree, fetchFormVersions, updateCarrier } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier } from "@/types";
import type { FormVersion } from "@/lib/api";
import styles from "../page.module.css";

interface FieldPosition {
  key: string;
  label: string;
  x: number; // % 기준
  y: number; // % 기준
  fontSize: number;
  page: number;
}

function EditorContent() {
  const { toast, showLoading, hideLoading } = useToast();
  const searchParams = useSearchParams();
  const carrierId = searchParams.get("carrier") || "";
  const router = useRouter();

  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMvno, setSelectedMvno] = useState(carrierId);
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [positions, setPositions] = useState<FieldPosition[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [placingField, setPlacingField] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);

  const allMvnos = tree.flatMap(m => m.children || []);
  const mvno = allMvnos.find(m => m.id === selectedMvno);
  const activeVersion = versions.find(v => v.is_active);

  // 필드 목록 (form_config에서 가져오거나 기본값)
  const fields = (() => {
    if (!mvno?.form_config) return [
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
    ];
    try {
      return JSON.parse(mvno.form_config).map((f: { key: string; label: string }) => ({ key: f.key, label: f.label }));
    } catch { return []; }
  })();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    const data = await fetchCarrierTree(false);
    setTree(data);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedMvno) return;
    fetchFormVersions(selectedMvno).then(setVersions);
    const m = tree.flatMap(t => t.children || []).find(c => c.id === selectedMvno);
    if (m?.form_fields) {
      try {
        const parsed = JSON.parse(m.form_fields);
        // form_fields가 좌표 배열이면 로드, PDF URL 배열이면 무시
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
          setPositions(parsed);
        }
      } catch {}
    }
  }, [selectedMvno, tree]);

  // PDF 렌더링
  const renderPage = useCallback(async (pageNum: number) => {
    if (!activeVersion || !canvasRef.current) return;
    const pages = JSON.parse(activeVersion.pages) as string[];
    const pdfUrl = pages[0];
    if (!pdfUrl?.endsWith(".pdf")) return;

    showLoading("PDF 렌더링 중...");
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
          setTimeout(() => reject(), 15000);
        });
      }

      const pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib as {
        getDocument: (p: { url: string }) => { promise: Promise<unknown> };
      };

      if (!pdfDocRef.current) {
        pdfDocRef.current = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
      }

      const doc = pdfDocRef.current as { numPages: number; getPage: (n: number) => Promise<unknown> };
      setTotalPages(doc.numPages);

      const page = await doc.getPage(pageNum) as {
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
      };

      const containerWidth = containerRef.current?.clientWidth || 800;
      const baseVp = page.getViewport({ scale: 1 });
      const scale = containerWidth / baseVp.width;
      const vp = page.getViewport({ scale });

      const canvas = canvasRef.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    } catch (err) {
      console.error(err);
      toast("PDF 렌더링 실패", "error");
    }
    hideLoading();
  }, [activeVersion, showLoading, hideLoading, toast]);

  useEffect(() => {
    if (activeVersion) {
      pdfDocRef.current = null;
      renderPage(currentPage);
    }
  }, [activeVersion, currentPage, renderPage]);

  // 캔버스 클릭 → 필드 배치
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingField || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPositions(prev => {
      const filtered = prev.filter(p => p.key !== placingField);
      const field = fields.find((f: { key: string; label: string }) => f.key === placingField);
      return [...filtered, { key: placingField, label: field?.label || placingField, x, y, fontSize: 12, page: currentPage }];
    });
    setPlacingField(null);
    toast(`"${fields.find((f: { key: string; label: string }) => f.key === placingField)?.label}" 배치 완료`, "success");
  };

  // 드래그로 위치 조정
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions(prev => prev.map(p => p.key === dragging ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p));
  };

  // 저장
  const handleSave = async () => {
    if (!selectedMvno) return;
    setSaving(true);
    await updateCarrier(selectedMvno, {
      form_fields: JSON.stringify(positions),
    } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("좌표가 저장되었습니다.", "success");
  };

  const removePosition = (key: string) => {
    setPositions(prev => prev.filter(p => p.key !== key));
  };

  const updateFontSize = (key: string, size: number) => {
    setPositions(prev => prev.map(p => p.key === key ? { ...p, fontSize: size } : p));
  };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  const pagePositions = positions.filter(p => p.page === currentPage);
  const placedKeys = new Set(positions.map(p => p.key));

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <a href="/" className={styles.sidebarLogo} style={{ textDecoration: "none", color: "inherit" }}><span className={styles.sidebarLogoIcon}>H</span>관리자</a>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/dashboard" className={styles.sidebarLink}>📊 대시보드</Link>
          <Link href="/admin/form-settings" className={styles.sidebarLink}>📝 신청서설정</Link>
          <Link href="/admin/form-editor" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>🎯 좌표 에디터</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>좌표 에디터</h1>
          <button className={styles.addBtn} onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "💾 좌표 저장"}
          </button>
        </div>

        {/* 통신사 선택 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>통신사</label>
            <select style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }} value={selectedMvno} onChange={e => { setSelectedMvno(e.target.value); pdfDocRef.current = null; }}>
              <option value="" disabled>선택하세요</option>
              {allMvnos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>◀</button>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>▶</button>
            </div>
          )}
        </div>

        {/* 배치 모드 안내 */}
        {placingField && (
          <div style={{ padding: "12px 20px", marginBottom: 16, background: "#DC2626", color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: "center", animation: "fadeIn 0.2s" }}>
            🎯 PDF 위에서 &quot;{fields.find((f: { key: string }) => f.key === placingField)?.label}&quot; 위치를 클릭하세요 &nbsp;
            <button onClick={() => setPlacingField(null)} style={{ marginLeft: 12, padding: "4px 12px", background: "rgba(255,255,255,0.2)", color: "white", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>취소</button>
          </div>
        )}

        {!activeVersion ? (
          <div className={styles.empty}>양식을 먼저 업로드하세요. <Link href="/admin/form-settings" style={{ color: "var(--brand)" }}>신청서 설정 →</Link></div>
        ) : (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* 좌측: PDF + 오버레이 */}
            <div ref={containerRef} style={{ flex: 1, position: "relative", background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #E8ECF1" }}
              onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ width: "100%", display: "block", cursor: placingField ? "crosshair" : "default" }}
              />
              {/* 배치된 필드 오버레이 */}
              {pagePositions.map(p => (
                <div
                  key={p.key}
                  onMouseDown={(e) => { e.preventDefault(); setDragging(p.key); }}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`, top: `${p.y}%`,
                    transform: "translate(-50%, -50%)",
                    padding: "2px 8px",
                    background: "rgba(37, 99, 235, 0.9)",
                    color: "white",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: dragging === p.key ? "grabbing" : "grab",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    zIndex: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {p.label}
                  <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>{p.fontSize}px</span>
                </div>
              ))}
            </div>

            {/* 우측: 필드 패널 */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--text-0)", marginBottom: 12 }}>필드 배치</h3>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>필드를 클릭 → PDF 위 원하는 위치 클릭</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {fields.map((f: { key: string; label: string }) => {
                    const placed = positions.find(p => p.key === f.key);
                    return (
                      <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, background: placed ? "#EFF6FF" : "#F8FAFC", border: placingField === f.key ? "2px solid #DC2626" : placed ? "1px solid #BFDBFE" : "1px solid #E8ECF1" }}>
                        <button
                          onClick={() => {
                            const next = placingField === f.key ? null : f.key;
                            setPlacingField(next);
                            if (next) toast(`"${f.label}" 선택됨 — PDF 위에서 위치를 클릭하세요`, "info");
                          }}
                          style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600, color: placed ? "var(--brand)" : "var(--text-1)", cursor: "pointer" }}
                        >
                          {placed ? "✓ " : "○ "}{f.label}
                        </button>
                        {placed && (
                          <>
                            <input
                              type="number"
                              value={placed.fontSize}
                              onChange={e => updateFontSize(f.key, Number(e.target.value))}
                              style={{ width: 36, padding: "2px 4px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 11, textAlign: "center" }}
                              title="폰트 크기"
                            />
                            <button onClick={() => removePosition(f.key)} style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
                  배치됨: {placedKeys.size}/{fields.length}
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
