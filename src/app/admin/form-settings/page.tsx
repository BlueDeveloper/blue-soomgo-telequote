"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarrierTree, updateCarrier, uploadImage } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

interface FormField {
  key: string;
  label: string;
  type: "text" | "phone" | "date" | "select" | "address";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const DEFAULT_FIELDS: FormField[] = [
  { key: "usimSerial", label: "USIM 일련번호", type: "text", required: false, placeholder: "USIM 일련번호" },
  { key: "customerType", label: "고객유형", type: "select", required: true, options: ["개인", "외국인", "청소년", "개인사업자", "법인사업자"] },
  { key: "subscriberName", label: "가입자명", type: "text", required: true, placeholder: "홍길동" },
  { key: "contactNumber", label: "개통번호/연락번호", type: "phone", required: true, placeholder: "010-0000-0000" },
  { key: "birthDate", label: "생년월일", type: "date", required: true, placeholder: "YYYY-MM-DD" },
  { key: "idNumber", label: "신분증번호/여권번호", type: "text", required: false, placeholder: "신분증 또는 여권 번호" },
  { key: "nationality", label: "국적", type: "text", required: false, placeholder: "대한민국" },
  { key: "address", label: "주소", type: "address", required: false },
  { key: "addressDetail", label: "상세주소", type: "text", required: false, placeholder: "상세주소" },
  { key: "activationType", label: "개통구분", type: "select", required: true, options: ["신규가입", "번호이동", "기기변경"] },
  { key: "desiredNumber", label: "희망번호", type: "text", required: false, placeholder: "010-XXXX-XXXX" },
  { key: "storeName", label: "판매점명", type: "text", required: false, placeholder: "판매점명" },
];

export default function FormSettingsPage() {
  const { toast } = useToast();
  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMvno, setSelectedMvno] = useState("");
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [formVersion, setFormVersion] = useState("v1");
  const [formTemplate, setFormTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // MVNO 선택 시 설정 로드
  useEffect(() => {
    if (!selectedMvno) return;
    const mvno = allMvnos.find(m => m.id === selectedMvno);
    if (!mvno) return;

    const fc = mvno.form_config as string | null;
    if (fc) {
      try { setFields(JSON.parse(fc)); } catch { setFields(DEFAULT_FIELDS); }
    } else {
      setFields(DEFAULT_FIELDS);
    }
    setFormVersion((mvno.form_version as string) || "v1");
    setFormTemplate((mvno.form_template as string) || "");
  }, [selectedMvno, allMvnos]);

  const handleSave = async () => {
    if (!selectedMvno) { toast("통신사를 선택해주세요.", "error"); return; }
    setSaving(true);
    await updateCarrier(selectedMvno, {
      form_config: JSON.stringify(fields),
      form_version: formVersion,
      form_template: formTemplate,
    } as unknown as Partial<Carrier>);
    setSaving(false);
    toast("저장되었습니다.", "success");
    load();
  };

  const toggleRequired = (index: number) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, required: !f.required } : f));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const addField = () => {
    setFields(prev => [...prev, { key: `custom_${Date.now()}`, label: "새 항목", type: "text", required: false, placeholder: "" }]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= fields.length) return;
    setFields(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
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
          <Link href="/admin/form-settings" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>📝 신청서 설정</Link>
          <Link href="/admin/applications" className={styles.sidebarLink}>📋 신청서</Link>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <nav className={styles.bottomTab}>
        <Link href="/admin/dashboard" className={styles.tabLink}><span className={styles.tabIcon}>📊</span><span className={styles.tabLabel}>대시보드</span></Link>
        <Link href="/admin/carriers" className={styles.tabLink}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/form-settings" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📝</span><span className={styles.tabLabel}>신청서설정</span></Link>
        <Link href="/admin/applications" className={styles.tabLink}><span className={styles.tabIcon}>📋</span><span className={styles.tabLabel}>신청서</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>신청서 설정</h1>
          <button className={styles.addBtn} onClick={handleSave} disabled={saving || !selectedMvno}>
            {saving ? "저장 중..." : "💾 저장"}
          </button>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : (
          <>
            {/* MVNO 선택 */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 240px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>통신사 선택</label>
                <select
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }}
                  value={selectedMvno}
                  onChange={(e) => setSelectedMvno(e.target.value)}
                >
                  <option value="" disabled>선택하세요</option>
                  {allMvnos.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div style={{ flex: "0 0 160px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>버전</label>
                <input
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit" }}
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  placeholder="v1"
                />
              </div>
            </div>

            {selectedMvno && (
              <>
                {/* 양식 템플릿 이미지 */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-0)", marginBottom: 14 }}>양식 템플릿 (인쇄용 배경)</h3>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {formTemplate && (
                      <img src={formTemplate} alt="양식" style={{ width: 120, height: 170, objectFit: "contain", border: "1px solid var(--border)", borderRadius: 8 }} />
                    )}
                    <label style={{ padding: "12px 20px", background: "#F8FAFC", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-1)", border: "2px solid #E8ECF1" }}>
                      {uploading ? "업로드 중..." : "이미지 업로드"}
                      <input type="file" accept="image/*" hidden onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const res = await uploadImage(file);
                        setUploading(false);
                        if (res.ok && res.data) { setFormTemplate(res.data.url); toast("업로드 완료", "success"); }
                        else toast("업로드 실패", "error");
                      }} />
                    </label>
                    {formTemplate && <button onClick={() => setFormTemplate("")} style={{ fontSize: 13, color: "var(--danger)", cursor: "pointer" }}>제거</button>}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>양식 이미지가 등록되면 인쇄 시 배경으로 사용됩니다. 미등록 시 기본 양식으로 출력됩니다.</p>
                </div>

                {/* 필드 목록 */}
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-0)" }}>신청서 항목</h3>
                    <button onClick={addField} style={{ padding: "8px 16px", background: "var(--brand)", color: "white", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ 항목 추가</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {fields.map((f, i) => (
                      <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#FAFBFD", borderRadius: 12, border: "1px solid #E8ECF1" }}>
                        {/* 순서 이동 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <button onClick={() => moveField(i, -1)} style={{ fontSize: 10, cursor: "pointer", color: "var(--text-3)", padding: "2px 4px" }}>▲</button>
                          <button onClick={() => moveField(i, 1)} style={{ fontSize: 10, cursor: "pointer", color: "var(--text-3)", padding: "2px 4px" }}>▼</button>
                        </div>

                        {/* 필수 토글 */}
                        <button
                          onClick={() => toggleRequired(i)}
                          style={{
                            width: 24, height: 24, borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer",
                            background: f.required ? "var(--brand)" : "#E2E8F0",
                            color: f.required ? "white" : "var(--text-3)",
                          }}
                        >
                          {f.required ? "✓" : ""}
                        </button>

                        {/* 라벨 */}
                        <input
                          value={f.label}
                          onChange={(e) => updateField(i, { label: e.target.value })}
                          style={{ flex: 1, padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                        />

                        {/* 타입 */}
                        <select
                          value={f.type}
                          onChange={(e) => updateField(i, { type: e.target.value as FormField["type"] })}
                          style={{ padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
                        >
                          <option value="text">텍스트</option>
                          <option value="phone">전화번호</option>
                          <option value="date">날짜</option>
                          <option value="select">선택</option>
                          <option value="address">주소</option>
                        </select>

                        {/* 선택 옵션 (select 타입일 때) */}
                        {f.type === "select" && (
                          <input
                            value={f.options?.join(",") || ""}
                            onChange={(e) => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                            placeholder="옵션1,옵션2,..."
                            style={{ width: 160, padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontFamily: "inherit" }}
                          />
                        )}

                        {/* 필수 라벨 */}
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.required ? "var(--brand)" : "var(--text-3)", minWidth: 28 }}>
                          {f.required ? "필수" : "선택"}
                        </span>

                        {/* 삭제 */}
                        <button onClick={() => removeField(i)} style={{ fontSize: 14, color: "var(--text-3)", cursor: "pointer", padding: "4px 8px" }}>✕</button>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12 }}>
                    ✓ = 필수 항목 · 드래그로 순서 변경 · select 타입은 쉼표로 옵션 구분
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
