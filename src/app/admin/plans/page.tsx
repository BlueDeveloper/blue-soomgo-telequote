"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarriers, fetchPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import type { Carrier, Plan } from "@/types";
import styles from "../page.module.css";

function PlansContent() {
  const searchParams = useSearchParams();
  const carrierId = searchParams.get("carrier") || "";
  const router = useRouter();

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(carrierId);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: "", monthly: 0, base_fee: 0, discount: 0,
    voice: "", sms: "", data: "", qos: "-",
    type: "postpaid" as "postpaid" | "prepaid", sort_order: 0,
  });

  const loadCarriers = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    const data = await fetchCarriers(false);
    setCarriers(data);
    if (!selectedCarrier && data.length > 0) {
      setSelectedCarrier(data[0].id);
    }
  }, [router, selectedCarrier]);

  const loadPlans = useCallback(async () => {
    if (!selectedCarrier) return;
    setLoading(true);
    const data = await fetchPlans(selectedCarrier, undefined, false);
    setPlans(data);
    setLoading(false);
  }, [selectedCarrier]);

  useEffect(() => { loadCarriers(); }, [loadCarriers]);
  useEffect(() => { loadPlans(); }, [loadPlans]);

  const carrierName = carriers.find((c) => c.id === selectedCarrier)?.title || selectedCarrier;

  const openCreate = () => {
    setForm({ name: "", monthly: 0, base_fee: 0, discount: 0, voice: "", sms: "", data: "", qos: "-", type: "postpaid", sort_order: plans.length + 1 });
    setEditing(null);
    setModal("create");
  };

  const openEdit = (p: Plan) => {
    setForm({ name: p.name, monthly: p.monthly, base_fee: p.base_fee, discount: p.discount, voice: p.voice, sms: p.sms, data: p.data, qos: p.qos, type: p.type, sort_order: p.sort_order });
    setEditing(p);
    setModal("edit");
  };

  const handleSave = async () => {
    if (modal === "create") {
      const res = await createPlan({ carrierId: selectedCarrier, ...form });
      if (!res.ok) { alert(res.error); return; }
    } else if (modal === "edit" && editing) {
      await updatePlan(editing.id, form);
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

  const formatPrice = (n: number) => n.toLocaleString() + "원";

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.sidebarLogoIcon}>H</span>
          관리자
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={styles.sidebarLink}>
            📱 통신사 관리
          </Link>
          <span className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>
            💰 요금제 관리
          </span>
        </nav>
        <div className={styles.sidebarLogout}>
          <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{carrierName} 요금제 관리</h1>
            <select
              style={{ marginTop: 8, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
            >
              {carriers.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <button className={styles.addBtn} onClick={openCreate}>+ 요금제 추가</button>
        </div>

        {loading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : plans.length === 0 ? (
          <div className={styles.empty}>등록된 요금제가 없습니다.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>순서</th>
                <th>요금제명</th>
                <th>월납부금액</th>
                <th>기본료</th>
                <th>할인</th>
                <th>유형</th>
                <th>데이터</th>
                <th>음성</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.sort_order}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{formatPrice(p.monthly)}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{formatPrice(p.base_fee)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{formatPrice(p.discount)}</td>
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
        )}

        {/* Modal */}
        {modal && (
          <div className={styles.overlay} onClick={() => setModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>
                {modal === "create" ? "요금제 추가" : "요금제 수정"}
              </h2>

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
                  <select className={styles.formSelect} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "postpaid" | "prepaid" })}>
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
