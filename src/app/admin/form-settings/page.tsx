"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarrierTree, updateCarrier, uploadImage, fetchFormVersions, createFormVersion, activateFormVersion, deleteFormVersion, deleteAllFormVersions } from "@/lib/api";
import type { FormVersion } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

// PDF.js lazy loader
async function loadPdfJs(): Promise<unknown> {
  if ((window as unknown as Record<string, unknown>).pdfjsLib) return (window as unknown as Record<string, unknown>).pdfjsLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.textContent = `import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';window.pdfjsLib=m;window.dispatchEvent(new Event('pdfjsReady'));});`;
    document.head.appendChild(s);
    const h = () => { window.removeEventListener("pdfjsReady", h); resolve((window as unknown as Record<string, unknown>).pdfjsLib); };
    window.addEventListener("pdfjsReady", h);
    setTimeout(() => reject(new Error("PDF.js 로드 타임아웃")), 15000);
  });
}

interface FormField {
  key: string; label: string; type: "text" | "phone" | "date" | "select" | "address"; required: boolean; options?: string[]; placeholder?: string;
}

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
  const router = useRouter();

  const allMvnos = tree.flatMap(m => m.children || []);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchCarrierTree(false);
    setTree(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // MVNO 선택 시 설정 + 버전 로드
  useEffect(() => {
    if (!selectedMvno || tree.length === 0) return;
    const mvno = tree.flatMap(m => m.children || []).find(m => m.id === selectedMvno);
    if (mvno) {
      try { setFields(mvno.form_config ? JSON.parse(mvno.form_config) : DEFAULT_FIELDS); } catch { setFields(DEFAULT_FIELDS); }
      try { setPreviewPages(mvno.form_fields ? JSON.parse(mvno.form_fields) : []); } catch { setPreviewPages([]); }
      setPreviewIdx(0);
    }
    fetchFormVersions(selectedMvno).then(setVersions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMvno, tree]);

  const activeVersion = versions.find(v => v.is_active);

  const handleSaveFields = async () => {
    if (!selectedMvno) { toast("통신사를 선택해주세요.", "error"); return; }
    setSaving(true);
    await updateCarrier(selectedMvno, { form_config: JSON.stringify(fields) } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("항목 설정이 저장되었습니다.", "success");
  };

  const handleUploadFile = async (file: File) => {
    showLoading("업로드 중...");
    try {
      // PDF든 이미지든 R2에 직접 업로드
      const fd = new FormData();
      fd.append("file", file);
      const token = sessionStorage.getItem("admin_token");
      const API = process.env.NEXT_PUBLIC_API_URL || "https://hlmobile-api.blueehdwp.workers.dev";
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const j = await res.json() as { ok: boolean; data?: { url: string }; error?: string };
      if (j.ok && j.data) {
        setUpgradePages([j.data.url]);
        toast("업로드 완료", "success");
      } else {
        toast(j.error || "업로드 실패", "error");
      }
    } catch {
      toast("업로드 실패", "error");
    }
    hideLoading();
  };

  const handleCreateVersion = async () => {
    if (upgradePages.length === 0) { toast("양식을 업로드해주세요.", "error"); return; }
    setSaving(true);
    const url = upgradePages[0];
    const isPdf = url.endsWith(".pdf");
    const res = await createFormVersion(selectedMvno, upgradeLabel || "", isPdf ? undefined : upgradePages, isPdf ? url : undefined);
    if (res.ok && res.data) {
      // 자동 활성화
      await activateFormVersion(res.data.id);
      toast(`v${res.data.version} 생성 및 활성화`, "success");
      fetchFormVersions(selectedMvno).then(setVersions);
      load(); // carriers 갱신
    }
    setSaving(false);
    setUpgradeModal(false);
    setUpgradePages([]);
    setUpgradeLabel("");
  };

  const handleDeleteAll = async () => {
    if (!confirm("이 통신사의 모든 양식 버전과 이미지를 삭제합니다. 계속할까요?")) return;
    showLoading("양식 삭제 중...");
    await deleteAllFormVersions(selectedMvno);
    setVersions([]);
    setPreviewPages([]);
    setPreviewIdx(0);
    hideLoading();
    toast("전체 양식이 삭제되었습니다.", "success");
    load();
  };

  const handleActivate = async (id: number, ver: number) => {
    await activateFormVersion(id);
    toast(`v${ver} 활성화`, "success");
    fetchFormVersions(selectedMvno).then(setVersions);
    load();
  };

  const handleDeleteVersion = async (id: number, ver: number) => {
    if (!confirm(`v${ver}을 삭제합니다. 관련 이미지도 함께 삭제됩니다.`)) return;
    showLoading("삭제 중...");
    await deleteFormVersion(id);
    hideLoading();
    toast(`v${ver} 삭제 완료`, "success");
    fetchFormVersions(selectedMvno).then(setVersions);
    load();
  };

  const toggleRequired = (i: number) => setFields(p => p.map((f, idx) => idx === i ? { ...f, required: !f.required } : f));
  const removeField = (i: number) => setFields(p => p.filter((_, idx) => idx !== i));
  const addField = () => setFields(p => [...p, { key: `custom_${Date.now()}`, label: "새 항목", type: "text", required: false }]);
  const updateField = (i: number, u: Partial<FormField>) => setFields(p => p.map((f, idx) => idx === i ? { ...f, ...u } : f));
  const moveField = (i: number, d: -1 | 1) => {
    const ni = i + d; if (ni < 0 || ni >= fields.length) return;
    setFields(p => { const a = [...p]; [a[i], a[ni]] = [a[ni], a[i]]; return a; });
  };

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

      <nav className={styles.bottomTab}>
        <Link href="/admin/dashboard" className={styles.tabLink}><span className={styles.tabIcon}>📊</span><span className={styles.tabLabel}>대시보드</span></Link>
        <Link href="/admin/carriers" className={styles.tabLink}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/form-settings" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📝</span><span className={styles.tabLabel}>설정</span></Link>
        <Link href="/admin/applications" className={styles.tabLink}><span className={styles.tabIcon}>📋</span><span className={styles.tabLabel}>신청서</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>신청서 설정</h1>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : (
          <>
            {/* MVNO 선택 */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>통신사 선택</label>
              <select style={{ width: "100%", maxWidth: 320, padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }} value={selectedMvno} onChange={(e) => setSelectedMvno(e.target.value)}>
                <option value="" disabled>선택하세요</option>
                {allMvnos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>

            {selectedMvno && (
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* 좌측: 양식 버전 관리 */}
                <div style={{ flex: "1 1 400px" }}>
                  {/* 현재 활성 버전 */}
                  <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-0)" }}>양식 버전</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        {versions.length > 0 && (
                          <button onClick={handleDeleteAll} style={{ padding: "10px 16px", background: "#FEF2F2", color: "#DC2626", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid #FECACA" }}>
                            🗑️ 전체 삭제
                          </button>
                        )}
                        <button onClick={() => { setUpgradeModal(true); setUpgradePages([]); setUpgradeLabel(""); }} style={{ padding: "10px 20px", background: "var(--brand)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          ⬆️ 버전 업그레이드
                        </button>
                      </div>
                    </div>

                    {activeVersion ? (
                      <div style={{ padding: 16, background: "#EFF6FF", borderRadius: 12, border: "1px solid #BFDBFE", marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--brand)" }}>v{activeVersion.version}</span>
                            {activeVersion.label && <span style={{ marginLeft: 8, fontSize: 13, color: "var(--text-2)" }}>{activeVersion.label}</span>}
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#DBEAFE", color: "#1D4ED8" }}>활성</span>
                          </div>
                          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{activeVersion.created_at?.slice(0, 10)}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: 20, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>등록된 양식이 없습니다. "버전 업그레이드"로 첫 양식을 등록하세요.</div>
                    )}

                    {/* 버전 히스토리 */}
                    {versions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>버전 히스토리</div>
                        {versions.map(v => (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid #F1F5F9", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: v.is_active ? "var(--brand)" : "var(--text-2)" }}>v{v.version}</span>
                              {v.label && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{v.label}</span>}
                              {v.is_active ? <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "#DBEAFE", color: "#1D4ED8" }}>활성</span> : null}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{v.created_at?.slice(0, 10)}</span>
                              {!v.is_active && (
                                <>
                                  <button onClick={() => handleActivate(v.id, v.version)} style={{ padding: "4px 10px", background: "#EFF6FF", color: "var(--brand)", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>사용</button>
                                  <button onClick={() => handleDeleteVersion(v.id, v.version)} style={{ padding: "4px 10px", background: "#FEF2F2", color: "#DC2626", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>삭제</button>
                                </>
                              )}
                              <button onClick={() => { try { setPreviewPages(JSON.parse(v.pages)); setPreviewIdx(0); } catch {} }} style={{ padding: "4px 10px", background: "#F1F5F9", color: "var(--text-2)", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>미리보기</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 미리보기 */}
                  {previewPages.length > 0 && (
                    <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-0)", marginBottom: 12 }}>양식 미리보기</h3>
                      {previewPages[0]?.endsWith(".pdf") ? (
                        <iframe
                          src={previewPages[0]}
                          style={{ width: "100%", height: 600, border: "1px solid #E8ECF1", borderRadius: 8 }}
                        />
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
                            {previewPages.map((u, i) => (
                              <div key={`${u}-${i}`} onClick={(e) => { e.stopPropagation(); setPreviewIdx(i); }}
                                style={{ width: 60, height: 80, borderRadius: 6, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: previewIdx === i ? "3px solid var(--brand)" : "1px solid #E8ECF1", position: "relative" }}>
                                <img src={u} alt={`p${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                                <span style={{ position: "absolute", bottom: 2, right: 4, fontSize: 9, fontWeight: 800, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{i + 1}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ maxHeight: 500, overflow: "auto", borderRadius: 8, border: "1px solid #E8ECF1" }}>
                            <img key={previewPages[previewIdx]} src={previewPages[previewIdx]} alt="미리보기" style={{ width: "100%", display: "block" }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 우측: 신청서 항목 설정 */}
                <div style={{ flex: "1 1 400px" }}>
                  <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-0)" }}>신청서 항목</h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={addField} style={{ padding: "8px 14px", background: "#F1F5F9", color: "var(--text-1)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 추가</button>
                        <button onClick={handleSaveFields} disabled={saving} style={{ padding: "8px 14px", background: "var(--brand)", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          {saving ? "저장 중..." : "💾 저장"}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {fields.map((f, i) => (
                        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#FAFBFD", borderRadius: 10, border: "1px solid #E8ECF1", fontSize: 13 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <button onClick={() => moveField(i, -1)} style={{ fontSize: 9, cursor: "pointer", color: "var(--text-3)" }}>▲</button>
                            <button onClick={() => moveField(i, 1)} style={{ fontSize: 9, cursor: "pointer", color: "var(--text-3)" }}>▼</button>
                          </div>
                          <button onClick={() => toggleRequired(i)} style={{ width: 22, height: 22, borderRadius: 5, fontSize: 11, fontWeight: 800, cursor: "pointer", background: f.required ? "var(--brand)" : "#E2E8F0", color: f.required ? "white" : "var(--text-3)" }}>
                            {f.required ? "✓" : ""}
                          </button>
                          <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} style={{ flex: 1, padding: "6px 10px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 13, outline: "none" }} />
                          <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FormField["type"] })} style={{ padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12 }}>
                            <option value="text">텍스트</option>
                            <option value="phone">전화번호</option>
                            <option value="date">날짜</option>
                            <option value="select">선택</option>
                            <option value="address">주소</option>
                          </select>
                          {f.type === "select" && <input value={f.options?.join(",") || ""} onChange={(e) => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="옵션1,옵션2" style={{ width: 120, padding: "6px 8px", border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 11 }} />}
                          <span style={{ fontSize: 10, fontWeight: 700, color: f.required ? "var(--brand)" : "var(--text-3)", minWidth: 22 }}>{f.required ? "필수" : "선택"}</span>
                          <button onClick={() => removeField(i)} style={{ fontSize: 13, color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 버전 업그레이드 모달 */}
        {upgradeModal && (
          <div className={styles.overlay} onClick={() => setUpgradeModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>양식 버전 업그레이드</h2>
                <button className={styles.modalClose} onClick={() => setUpgradeModal(false)}>✕</button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>버전 메모 (선택)</label>
                <input className={styles.formInput} value={upgradeLabel} onChange={e => setUpgradeLabel(e.target.value)} placeholder="예: 26년 4월 양식" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>양식 파일</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ padding: "14px 24px", background: "#FEF3C7", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#92400E", border: "2px solid #FDE68A" }}>
                    📄 PDF 업로드
                    <input type="file" accept=".pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
                  </label>
                  <label style={{ padding: "14px 24px", background: "#F8FAFC", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--text-1)", border: "2px solid #E8ECF1" }}>
                    🖼️ 이미지 업로드
                    <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
                  </label>
                </div>
              </div>

              {upgradePages.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#059669", marginBottom: 8 }}>✓ 파일 업로드 완료</div>
                  {upgradePages[0]?.endsWith(".pdf") ? (
                    <iframe src={upgradePages[0]} style={{ width: "100%", height: 300, border: "1px solid #E8ECF1", borderRadius: 8 }} />
                  ) : (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                      {upgradePages.map((u, i) => (
                        <img key={i} src={u} alt={`p${i + 1}`} style={{ width: 80, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #E8ECF1" }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setUpgradeModal(false)}>취소</button>
                <button className={styles.saveBtn} onClick={handleCreateVersion} disabled={upgradePages.length === 0 || saving}>
                  {saving ? "생성 중..." : `v${(versions[0]?.version || 0) + 1} 생성 및 활성화`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
