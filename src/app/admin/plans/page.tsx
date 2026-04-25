"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarrierTree, fetchPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import type { Carrier, Plan } from "@/types";
import styles from "../page.module.css";

function PlansContent() {
  const searchParams = useSearchParams();
  const carrierId = searchParams.get("carrier") || "";
  const router = useRouter();

  const [tree, setTree] = useState<Carrier[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(carrierId);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "", monthly: 0, base_fee: 0, discount: 0,
    voice: "", sms: "", data: "", qos: "-",
    type: "" as string, sort_order: 0,
  });

  const loadCarriers = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    const data = await fetchCarrierTree(false);
    setTree(data);
    setSelectedCarrier((prev) => {
      if (prev) return prev;
      if (data.length > 0 && data[0].children && data[0].children.length > 0) return data[0].children[0].id;
      return "";
    });
  }, [router]);

  const loadPlans = useCallback(async () => {
    if (!selectedCarrier) return;
    setLoading(true);
    const data = await fetchPlans(selectedCarrier, undefined, false);
    setPlans(data);
    setLoading(false);
  }, [selectedCarrier]);

  useEffect(() => { loadCarriers(); }, [loadCarriers]);
  useEffect(() => { loadPlans(); }, [loadPlans]);

  const carrierName = tree.flatMap(m => m.children || []).find((c) => c.id === selectedCarrier)?.title || selectedCarrier;

  const openCreate = () => {
    setForm({ name: "", monthly: 0, base_fee: 0, discount: 0, voice: "", sms: "", data: "", qos: "-", type: "", sort_order: plans.length + 1 });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: Plan) => {
    setForm({ name: p.name, monthly: p.monthly, base_fee: p.base_fee, discount: p.discount, voice: p.voice, sms: p.sms, data: p.data, qos: p.qos, type: p.type, sort_order: p.sort_order });
    setEditing(p);
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("요금제명을 입력해주세요."); return; }
    if (!form.monthly) { alert("월납부금액을 입력해주세요."); return; }
    if (!form.type) { alert("유형을 선택해주세요."); return; }
    if (!form.voice.trim()) { alert("음성을 입력해주세요."); return; }
    if (!form.sms.trim()) { alert("문자를 입력해주세요."); return; }
    if (!form.data.trim()) { alert("데이터를 입력해주세요."); return; }

    if (modal === "create") {
      const res = await createPlan({ carrierId: selectedCarrier, ...form, type: form.type as "postpaid" | "prepaid" });
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "edit" && editing) {
      await updatePlan(editing.id, { ...form, type: form.type as "postpaid" | "prepaid" });
    }
    setModal(null);
    loadPlans();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 요금제를 삭제합니다.`)) return;
    await deletePlan(id);
    loadPlans();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const fmt = (n: number) => n.toLocaleString() + "원";

  return (
    <div className={styles.adminLayout}>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><span className={styles.sidebarLogoIcon}>H</span>관리자</div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={styles.sidebarLink}>📱 통신사</Link>
          <span className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>💰 요금제</span>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      {/* Mobile Bottom Tab */}
      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={styles.tabLink}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <Link href="/admin/notices" className={styles.tabLink}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>요금제 관리</h1>
            <select
              style={{ marginTop: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, fontFamily: "inherit", width: "100%" }}
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
            >
              <option value="" disabled>선택하세요</option>
              {tree.map((mno) => (
                <optgroup key={mno.id} label={mno.title}>
                  {(mno.children || []).map((mvno) => (
                    <option key={mvno.id} value={mvno.id}>{mvno.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button className={styles.addBtn} onClick={openCreate}>+ 추가</button>
        </div>

        {loading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : plans.length === 0 ? (
          <div className={styles.empty}>{carrierName}에 등록된 요금제가 없습니다.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순서</th><th>요금제명</th><th>월납부금액</th><th>기본료</th><th>할인</th><th>유형</th><th>데이터</th><th>음성</th><th>상태</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sort_order}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(p.monthly)}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(p.base_fee)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{fmt(p.discount)}</td>
                    <td>{p.type === "postpaid" ? "후불" : "선불"}</td>
                    <td>{p.data}</td>
                    <td>{p.voice}</td>
                    <td>{p.is_active ? "✅" : "❌"}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button className={styles.editBtn} onClick={() => openEdit(p)}>수정</button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(p.id, p.name)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className={styles.cardList}>
              {plans.map((p) => (
                <div key={p.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>{p.name}</div>
                    <span className={`${styles.cardBadge} ${p.is_active ? styles.cardBadgeActive : styles.cardBadgeInactive}`}>
                      {p.type === "postpaid" ? "후불" : "선불"}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardField}>
                      <span className={styles.cardFieldLabel}>월 요금</span>
                      <span className={styles.cardFieldValue} style={{ color: "var(--brand)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmt(p.monthly)}</span>
                    </div>
                    <div className={styles.cardField}>
                      <span className={styles.cardFieldLabel}>할인</span>
                      <span className={styles.cardFieldValue} style={{ color: "var(--danger)", fontFamily: "var(--font-mono)" }}>{fmt(p.discount)}</span>
                    </div>
                    <div className={styles.cardField}>
                      <span className={styles.cardFieldLabel}>데이터</span>
                      <span className={styles.cardFieldValue}>{p.data}</span>
                    </div>
                    <div className={styles.cardField}>
                      <span className={styles.cardFieldLabel}>음성</span>
                      <span className={styles.cardFieldValue}>{p.voice}</span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.cardEditBtn} onClick={() => openEdit(p)}>수정</button>
                    <button className={styles.cardDeleteBtn} onClick={() => handleDelete(p.id, p.name)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{modal === "create" ? "요금제 추가" : "요금제 수정"}</h2>
                <button className={styles.modalClose} onClick={() => setModal(null)}>✕</button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>요금제명</label>
                <input className={styles.formInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 5G 다이렉트 59" />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>월납부금액</label>
                  <input className={styles.formInput} type="number" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: Number(e.target.value) })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>기본료</label>
                  <input className={styles.formInput} type="number" value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>프로모션 할인</label>
                  <input className={styles.formInput} type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>유형</label>
                  <select className={styles.formSelect} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="" disabled>선택하세요</option>
                    <option value="postpaid">후불</option>
                    <option value="prepaid">선불</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>음성</label>
                  <input className={styles.formInput} value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })} placeholder="예: 무제한" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>문자</label>
                  <input className={styles.formInput} value={form.sms} onChange={(e) => setForm({ ...form, sms: e.target.value })} placeholder="예: 무제한" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>데이터</label>
                  <input className={styles.formInput} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} placeholder="예: 12GB" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>QOS</label>
                  <input className={styles.formInput} value={form.qos} onChange={(e) => setForm({ ...form, qos: e.target.value })} placeholder="예: 최대 150Mbps" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>정렬 순서</label>
                <input className={styles.formInput} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
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

export default function PlansPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>불러오는 중...</div>}>
      <PlansContent />
    </Suspense>
  );
}
