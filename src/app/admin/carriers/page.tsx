"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarrierTree, createCarrier, updateCarrier, deleteCarrier, uploadImage } from "@/lib/api";
import type { Carrier } from "@/types";
import styles from "../page.module.css";
import cs from "./carriers.module.css";

export default function CarriersPage() {
  const [tree, setTree] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMno, setActiveMno] = useState<string>("");
  const [modal, setModal] = useState<"create-mno" | "create-mvno" | "edit" | null>(null);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [form, setForm] = useState({ id: "", icon: "", title: "", description: "", forms: "", sort_order: 0, paymentType: "both" as string });
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchCarrierTree(false);
    setTree(data);
    setActiveMno((prev) => prev || (data.length > 0 ? data[0].id : ""));
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const activeMnoData = tree.find(m => m.id === activeMno);
  const mvnoList = activeMnoData?.children || [];

  const openCreateMno = () => {
    setForm({ id: "", icon: "", title: "", description: "", forms: "", sort_order: tree.length + 1, paymentType: "both" });
    setEditing(null); setModal("create-mno");
  };

  const openCreateMvno = () => {
    setForm({ id: "", icon: "", title: "", description: "", forms: "가입신청서", sort_order: mvnoList.length + 1, paymentType: "both" });
    setEditing(null); setModal("create-mvno");
  };

  const openEdit = (c: Carrier) => {
    setForm({ id: c.id, icon: c.icon, title: c.title, description: c.description, forms: c.forms, sort_order: c.sort_order, paymentType: c.payment_type || "both" });
    setEditing(c); setModal("edit");
  };

  const handleSave = async () => {
    if (modal === "create-mno") {
      const res = await createCarrier({ ...form, parentId: null } as unknown as Partial<Carrier>);
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "create-mvno") {
      const res = await createCarrier({ ...form, parentId: activeMno } as unknown as Partial<Carrier>);
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "edit" && editing) {
      const { id: _id, ...rest } = form;
      await updateCarrier(editing.id, rest as unknown as Partial<Carrier>);
    }
    setModal(null); load();
  };

  const handleDelete = async (c: Carrier) => {
    const isMno = !c.parent_id;
    if (!confirm(`"${c.title}" ${isMno ? "대분류와 소속 알뜰폰/요금제를 모두" : "알뜰폰과 요금제를"} 삭제합니다.`)) return;
    await deleteCarrier(c.id); load();
  };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  const isImg = (s: string) => s && (s.startsWith("http") || s.startsWith("/"));
  const renderIcon = (icon: string, title: string, size = 28) =>
    isImg(icon) ? <img src={icon} alt={title} style={{ width: size, height: size, objectFit: "contain", borderRadius: 4 }} /> : <span style={{ fontSize: size * 0.75 }}>{icon || "📱"}</span>;

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
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

      {/* Mobile Tab */}
      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={styles.tabLink}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <Link href="/admin/notices" className={styles.tabLink}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>통신사 관리</h1>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : (
          <div className={cs.layout}>
            {/* 좌측: 대분류 탭 */}
            <div className={cs.mnoPanel}>
              <div className={cs.mnoPanelTitle}>대분류 (MNO)</div>
              {tree.map((mno) => (
                <div
                  key={mno.id}
                  className={`${cs.mnoItem} ${activeMno === mno.id ? cs.mnoItemActive : ""}`}
                  onClick={() => setActiveMno(mno.id)}
                >
                  <div className={cs.mnoItemIcon}>{renderIcon(mno.icon, mno.title, 28)}</div>
                  <div className={cs.mnoItemInfo}>
                    <div className={cs.mnoItemName}>{mno.title}</div>
                    <div className={cs.mnoItemMeta}>{mno.description} · {mno.children?.length || 0}개</div>
                  </div>
                  <div className={cs.mnoItemActions}>
                    <button className={cs.iconBtn} onClick={(e) => { e.stopPropagation(); openEdit(mno); }} title="수정">✏️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 우측: 선택된 대분류의 알뜰폰 목록 */}
            <div className={cs.mvnoPanel}>
              <div className={cs.mvnoPanelHeader}>
                <div>
                  <div className={cs.mvnoPanelTitle}>
                    {activeMnoData && renderIcon(activeMnoData.icon, activeMnoData.title, 24)}
                    {activeMnoData?.title || "대분류 선택"} 소속 알뜰폰
                  </div>
                  <div className={cs.mvnoPanelMeta}>{mvnoList.length}개 등록</div>
                </div>
                <button className={styles.addBtn} onClick={openCreateMvno}>+ 알뜰폰 추가</button>
              </div>

              {mvnoList.length === 0 ? (
                <div className={styles.empty}>등록된 알뜰폰이 없습니다.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>순서</th>
                      <th>아이콘</th>
                      <th>ID</th>
                      <th>통신사명</th>
                      <th>설명</th>
                      <th>결제방식</th>
                      <th>상태</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mvnoList.map((mvno) => (
                      <tr key={mvno.id}>
                        <td>{mvno.sort_order}</td>
                        <td>{renderIcon(mvno.icon, mvno.title, 28)}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{mvno.id}</td>
                        <td style={{ fontWeight: 600 }}>{mvno.title}</td>
                        <td>{mvno.description}</td>
                        <td>
                          <span className={cs.badge} data-type={mvno.payment_type}>
                            {mvno.payment_type === "postpaid" ? "후불" : mvno.payment_type === "prepaid" ? "선불" : "후불+선불"}
                          </span>
                        </td>
                        <td>{mvno.is_active ? "✅" : "❌"}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button className={styles.editBtn} onClick={() => openEdit(mvno)}>수정</button>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(mvno)}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Mobile: 카드 리스트 */}
              <div className={styles.cardList}>
                {mvnoList.map((mvno) => (
                  <div key={mvno.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitle}>
                        {renderIcon(mvno.icon, mvno.title, 24)}
                        {mvno.title}
                      </div>
                      <span className={cs.badge} data-type={mvno.payment_type}>
                        {mvno.payment_type === "postpaid" ? "후불" : mvno.payment_type === "prepaid" ? "선불" : "후불+선불"}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardField}><span className={styles.cardFieldLabel}>ID</span><span className={styles.cardFieldValue}>{mvno.id}</span></div>
                      <div className={styles.cardField}><span className={styles.cardFieldLabel}>설명</span><span className={styles.cardFieldValue}>{mvno.description}</span></div>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.cardEditBtn} onClick={() => openEdit(mvno)}>수정</button>
                      <button className={styles.cardDeleteBtn} onClick={() => handleDelete(mvno)}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                {modal === "create-mno" ? "대분류 추가" : modal === "create-mvno" ? `알뜰폰 추가 (${activeMnoData?.title})` : `${editing?.parent_id ? "알뜰폰" : "대분류"} 수정`}
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
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {form.icon && renderIcon(form.icon, "preview", 48)}
                  <label style={{ padding: "10px 16px", background: "#F8FAFC", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-1)", border: "2px solid #E8ECF1" }}>
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
                  <input className={styles.formInput} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="또는 URL 직접 입력" style={{ flex: 1, minWidth: 180 }} />
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
