"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchNotices, createNotice, updateNotice, deleteNotice } from "@/lib/api";
import type { Notice } from "@/types";
import styles from "../page.module.css";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: "", content: "", isPinned: false });
  const router = useRouter();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchNotices();
    setNotices(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ title: "", content: "", isPinned: false }); setEditing(null); setModal("create"); };
  const openEdit = (n: Notice) => { setForm({ title: n.title, content: n.content, isPinned: !!n.is_pinned }); setEditing(n); setModal("edit"); };

  const handleSave = async () => {
    if (modal === "create") {
      const res = await createNotice(form);
      if (!res.ok) { alert(res.error); return; }
    } else if (editing) {
      await updateNotice(editing.id, form);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("공지사항을 삭제합니다.")) return;
    await deleteNotice(id);
    load();
  };

  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><span className={styles.sidebarLogoIcon}>H</span>관리자</div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={styles.sidebarLink}>📱 통신사</Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>💰 요금제</Link>
          <Link href="/admin/notices" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={styles.tabLink}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={styles.tabLink}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <Link href="/admin/notices" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>공지사항 관리</h1>
          <button className={styles.addBtn} onClick={openCreate}>+ 작성</button>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : notices.length === 0 ? <div className={styles.empty}>등록된 공지가 없습니다.</div> : (
          <>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>제목</th><th>고정</th><th>작성일</th><th>관리</th></tr></thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.id}>
                    <td>{n.id}</td>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td>{n.is_pinned ? "📌" : ""}</td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>{n.created_at?.slice(0, 10)}</td>
                    <td><div className={styles.tableActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(n)}>수정</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(n.id)}>삭제</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.cardList}>
              {notices.map((n) => (
                <div key={n.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>{n.is_pinned ? "📌 " : ""}{n.title}</div>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{n.created_at?.slice(0, 10)}</span>
                  </div>
                  <div style={{ padding: "0 16px 8px", fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>{n.content}</div>
                  <div className={styles.cardActions}>
                    <button className={styles.cardEditBtn} onClick={() => openEdit(n)}>수정</button>
                    <button className={styles.cardDeleteBtn} onClick={() => handleDelete(n.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>{modal === "create" ? "공지 작성" : "공지 수정"}</h2>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>제목</label>
                <input className={styles.formInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="공지 제목" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>내용</label>
                <textarea className={styles.formInput} rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="공지 내용" style={{ resize: "vertical", minHeight: 150 }} />
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>📌 메인 공지로 고정</span>
                </label>
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
