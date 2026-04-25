"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarrierTree, createCarrier, updateCarrier, deleteCarrier, uploadImage } from "@/lib/api";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

export default function CarriersPage() {
  const [tree, setTree] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMno, setExpandedMno] = useState<string | null>(null);
  const [modal, setModal] = useState<"create-mno" | "create-mvno" | "edit" | null>(null);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [targetMno, setTargetMno] = useState<string>("");
  const [form, setForm] = useState({ id: "", icon: "", title: "", description: "", forms: "", sort_order: 0, paymentType: "both" as string });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchCarrierTree(false);
    setTree(data);
    if (!expandedMno && data.length > 0) setExpandedMno(data[0].id);
    setLoading(false);
  }, [router, expandedMno]);

  useEffect(() => { load(); }, [load]);

  const openCreateMno = () => {
    setForm({ id: "", icon: "", title: "", description: "", forms: "", sort_order: tree.length + 1, paymentType: "both" });
    setEditing(null);
    setModal("create-mno");
  };

  const openCreateMvno = (mnoId: string) => {
    const mno = tree.find((m) => m.id === mnoId);
    const childCount = mno?.children?.length || 0;
    setTargetMno(mnoId);
    setForm({ id: "", icon: "", title: "", description: "", forms: "가입신청서", sort_order: childCount + 1, paymentType: "both" });
    setEditing(null);
    setModal("create-mvno");
  };

  const openEdit = (c: Carrier) => {
    setForm({ id: c.id, icon: c.icon, title: c.title, description: c.description, forms: c.forms, sort_order: c.sort_order, paymentType: c.payment_type || "both" });
    setEditing(c);
    setModal("edit");
  };

  const handleSave = async () => {
    if (modal === "create-mno") {
      const res = await createCarrier({ ...form, parentId: null } as unknown as Partial<Carrier>);
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "create-mvno") {
      const res = await createCarrier({ ...form, parentId: targetMno } as unknown as Partial<Carrier>);
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "edit" && editing) {
      const { id: _id, ...rest } = form;
      await updateCarrier(editing.id, rest as unknown as Partial<Carrier>);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (c: Carrier) => {
    const isMno = !c.parent_id;
    const msg = isMno
      ? `"${c.title}" 대분류와 소속 알뜰폰/요금제를 모두 삭제합니다.`
      : `"${c.title}" 알뜰폰과 소속 요금제를 모두 삭제합니다.`;
    if (!confirm(msg)) return;
    await deleteCarrier(c.id);
    load();
  };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  const isImg = (s: string) => s && (s.startsWith("http") || s.startsWith("/"));
  const renderIcon = (icon: string, title: string, size = 28) =>
    isImg(icon) ? <img src={icon} alt={title} style={{ width: size, height: size, objectFit: "contain", borderRadius: 4 }} /> : <span style={{ fontSize: size * 0.75 }}>{icon || "📱"}</span>;

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><span className={styles.sidebarLogoIcon}>H</span>관리자</div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>📱 통신사</Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>💰 요금제</Link>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={styles.tabLink}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <Link href="/admin/notices" className={styles.tabLink}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={styles.tabLink}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <button className={styles.tabLink} onClick={handleLogout}><span className={styles.tabIcon}>🚪</span><span className={styles.tabLabel}>로그아웃</span></button>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>통신사 관리</h1>
          <button className={styles.addBtn} onClick={openCreateMno}>+ 대분류 추가</button>
        </div>

        {loading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tree.map((mno) => (
              <div key={mno.id} className={styles.card} style={{ border: expandedMno === mno.id ? "2px solid var(--brand)" : undefined }}>
                {/* MNO Header */}
                <div className={styles.cardHeader} onClick={() => setExpandedMno(expandedMno === mno.id ? null : mno.id)} style={{ cursor: "pointer" }}>
                  <div className={styles.cardTitle}>
                    {renderIcon(mno.icon, mno.title, 32)}
                    <div>
                      <div>{mno.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>{mno.description} · 알뜰폰 {mno.children?.length || 0}개</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{expandedMno === mno.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* MNO Actions */}
                <div className={styles.cardActions} style={{ borderTop: "none", paddingTop: 4, marginTop: 4 }}>
                  <button className={styles.cardEditBtn} onClick={() => openEdit(mno)}>대분류 수정</button>
                  <button className={styles.cardDeleteBtn} onClick={() => handleDelete(mno)}>삭제</button>
                </div>

                {/* MVNO Children */}
                {expandedMno === mno.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>소속 알뜰폰</span>
                      <button className={styles.addBtn} style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => openCreateMvno(mno.id)}>+ 알뜰폰 추가</button>
                    </div>

                    {(!mno.children || mno.children.length === 0) ? (
                      <div style={{ padding: "16px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>등록된 알뜰폰이 없습니다.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {mno.children.map((mvno) => (
                          <div key={mvno.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--surface-1)", borderRadius: 10, gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {renderIcon(mvno.icon, mvno.title, 24)}
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-0)" }}>{mvno.title}</div>
                                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{mvno.id} · {mvno.description} · {mvno.payment_type === "postpaid" ? "후불" : mvno.payment_type === "prepaid" ? "선불" : "후불+선불"}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className={styles.editBtn} onClick={() => openEdit(mvno)}>수정</button>
                              <button className={styles.deleteBtn} onClick={() => handleDelete(mvno)}>삭제</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                {modal === "create-mno" ? "대분류 추가" : modal === "create-mvno" ? `알뜰폰 추가 (${tree.find(m => m.id === targetMno)?.title})` : `${editing?.parent_id ? "알뜰폰" : "대분류"} 수정`}
              </h2>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ID (영문)</label>
                  <input className={styles.formInput} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={modal === "edit"} placeholder="예: kt-mmobile" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>이름</label>
                  <input className={styles.formInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: KT M모바일" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>아이콘 이미지</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {form.icon && renderIcon(form.icon, "preview", 48)}
                  <label style={{ padding: "10px 16px", background: "var(--surface-1)", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-1)", border: "1px solid var(--border)" }}>
                    {uploading ? "업로드 중..." : "이미지 선택"}
                    <input type="file" accept="image/*" hidden onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const res = await uploadImage(file);
                      setUploading(false);
                      if (res.ok && res.data) setForm({ ...form, icon: res.data.url });
                      else alert("업로드 실패");
                    }} />
                  </label>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>또는</span>
                  <input className={styles.formInput} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="URL 직접 입력" style={{ flex: 1 }} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>설명</label>
                <input className={styles.formInput} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="예: KT 알뜰폰" />
              </div>

              {modal === "create-mvno" || (modal === "edit" && editing?.parent_id) ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>결제 방식</label>
                  <select className={styles.formSelect} value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
                    <option value="both">후불 + 선불</option>
                    <option value="postpaid">후불만</option>
                    <option value="prepaid">선불만</option>
                  </select>
                </div>
              ) : null}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>양식</label>
                  <input className={styles.formInput} value={form.forms} onChange={(e) => setForm({ ...form, forms: e.target.value })} placeholder="예: 가입신청서" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>정렬 순서</label>
                  <input className={styles.formInput} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setModal(null)}>취소</button>
                <button className={styles.saveBtn} onClick={handleSave}>저장</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
