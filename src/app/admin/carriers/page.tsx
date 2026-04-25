"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCarriers, createCarrier, updateCarrier, deleteCarrier } from "@/lib/api";
import type { Carrier } from "@/types";
import styles from "../page.module.css";

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [form, setForm] = useState({ id: "", icon: "", icon_style: "serviceIconBlue", title: "", description: "", forms: "", sort_order: 0 });
  const router = useRouter();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchCarriers(false);
    setCarriers(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ id: "", icon: "", icon_style: "serviceIconBlue", title: "", description: "", forms: "", sort_order: carriers.length + 1 });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (c: Carrier) => {
    setForm({ id: c.id, icon: c.icon, icon_style: c.icon_style, title: c.title, description: c.description, forms: c.forms, sort_order: c.sort_order });
    setEditing(c);
    setModal("edit");
  };

  const handleSave = async () => {
    if (modal === "create") {
      const res = await createCarrier(form);
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "edit" && editing) {
      const { id: _id, ...rest } = form;
      await updateCarrier(editing.id, rest);
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 통신사와 소속 요금제를 모두 삭제합니다. 계속할까요?`)) return;
    await deleteCarrier(id);
    load();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const isImageUrl = (str: string) => str.startsWith("http") || str.startsWith("/");

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.sidebarLogoIcon}>H</span>
          관리자
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>
            📱 통신사 관리
          </Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>
            💰 요금제 관리
          </Link>
        </nav>
        <div className={styles.sidebarLogout}>
          <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>통신사 관리</h1>
          <button className={styles.addBtn} onClick={openCreate}>+ 통신사 추가</button>
        </div>

        {loading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : carriers.length === 0 ? (
          <div className={styles.empty}>등록된 통신사가 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>순서</th>
                <th>아이콘</th>
                <th>ID</th>
                <th>통신사명</th>
                <th>설명</th>
                <th>양식</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {carriers.map((c) => (
                <tr key={c.id}>
                  <td>{c.sort_order}</td>
                  <td>
                    {isImageUrl(c.icon) ? (
                      <img src={c.icon} alt={c.title} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
                    ) : (
                      <span style={{ fontSize: 24 }}>{c.icon}</span>
                    )}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{c.description}</td>
                  <td>{c.forms}</td>
                  <td>{c.is_active ? "✅" : "❌"}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(c)}>수정</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(c.id, c.title)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                {modal === "create" ? "통신사 추가" : "통신사 수정"}
              </h2>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ID (영문)</label>
                  <input
                    className={styles.formInput}
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={modal === "edit"}
                    placeholder="예: kt-mmobile"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>통신사명</label>
                  <input
                    className={styles.formInput}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="예: KT M모바일"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>아이콘 (이모지 또는 이미지 URL)</label>
                <input
                  className={styles.formInput}
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="📱 또는 https://example.com/logo.png"
                />
                {form.icon && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>미리보기:</span>
                    {isImageUrl(form.icon) ? (
                      <img src={form.icon} alt="preview" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, border: "1px solid var(--border)" }} />
                    ) : (
                      <span style={{ fontSize: 32 }}>{form.icon}</span>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>설명</label>
                <input
                  className={styles.formInput}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="예: KT 알뜰폰"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>양식</label>
                  <input
                    className={styles.formInput}
                    value={form.forms}
                    onChange={(e) => setForm({ ...form, forms: e.target.value })}
                    placeholder="예: 가입신청서"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>정렬 순서</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
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
