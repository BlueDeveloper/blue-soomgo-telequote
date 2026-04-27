"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarrierTree, updateCarrier } from "@/lib/api";
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
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initCarrier = searchParams.get("carrier") || "";
  const router = useRouter();

  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMvno, setSelectedMvno] = useState(initCarrier);
  const [pdfUrl, setPdfUrl] = useState("");
  const [fields, setFields] = useState<{ key: string; label: string }[]>([]);
  const [positions, setPositions] = useState<FieldPos[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [placingField, setPlacingField] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const allMvnos = tree.flatMap(m => m.children || []);

  // 1. 트리 로드
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    fetchCarrierTree(false).then(setTree);
  }, [router]);

  // 2. MVNO 선택
  useEffect(() => {
    if (!selectedMvno || tree.length === 0) return;
    const m = allMvnos.find(c => c.id === selectedMvno);
    if (!m) return;

    setPdfUrl(m.form_template || "");
    setCurrentPage(1);

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

  // 오버레이 클릭 → 필드 배치
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingField || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
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
    if (!dragging || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
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
          <Link href="/admin/carriers" className={styles.sidebarLink}>📱 통신사</Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>💰 요금제</Link>
          <Link href="/admin/applications" className={styles.sidebarLink}>📋 신청서</Link>
          <Link href="/admin/form-settings" className={styles.sidebarLink}>📝 신청서설정</Link>
          <Link href="/admin/form-editor" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>🎯 좌표에디터</Link>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
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
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>◀</button>
            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 40, textAlign: "center" }}>p{currentPage}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E8ECF1", cursor: "pointer", fontWeight: 600 }}>▶</button>
          </div>
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
            {/* 좌측: PDF iframe + 투명 오버레이 */}
            <div style={{ flex: 1, position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #E8ECF1" }}>
              {/* 브라우저 내장 PDF 뷰어 */}
              <iframe
                src={`${pdfUrl}#page=${currentPage}`}
                style={{ width: "100%", height: 800, display: "block", border: "none" }}
              />

              {/* 투명 오버레이 (필드 배치 + 드래그용) */}
              <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setDragging(null)}
                onMouseLeave={() => setDragging(null)}
                style={{
                  position: "absolute", inset: 0,
                  cursor: placingField ? "crosshair" : "default",
                  // 배치 모드일 때만 이벤트 받음, 아니면 PDF 스크롤 허용
                  pointerEvents: placingField || dragging ? "auto" : "none",
                }}
              >
                {pagePositions.map(p => (
                  <div key={p.key}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDragging(p.key); }}
                    style={{
                      position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)",
                      padding: "3px 10px", background: "rgba(37,99,235,0.9)", color: "white", borderRadius: 4,
                      fontSize: 11, fontWeight: 700, cursor: dragging === p.key ? "grabbing" : "grab",
                      whiteSpace: "nowrap", userSelect: "none", zIndex: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      pointerEvents: "auto",
                    }}>
                    {p.label} <span style={{ fontSize: 9, opacity: 0.7 }}>{p.fontSize}px</span>
                  </div>
                ))}
              </div>
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
                          {placed && <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 4 }}>p{placed.page}</span>}
                        </button>
                        {placed && (
                          <>
                            <input type="number" value={placed.fontSize}
                              onChange={e => setPositions(prev => prev.map(p => p.key === f.key ? { ...p, fontSize: Number(e.target.value) } : p))}
                              style={{ width: 36, padding: "2px 4px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 11, textAlign: "center" }} title="px" />
                            <button onClick={() => setPositions(prev => prev.filter(p => p.key !== f.key))} style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>
                  배치됨: {positions.length}/{fields.length} · 현재 페이지: {currentPage}
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
