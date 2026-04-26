"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCarrierTree, fetchPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Carrier, Plan } from "@/types";
import styles from "../page.module.css";

function PlansContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const carrierId = searchParams.get("carrier") || "";
  const router = useRouter();

  const [tree, setTree] = useState<Carrier[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState(carrierId);
  const [filterType, setFilterType] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
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

  const allMvnos = tree.flatMap(m => m.children || []);
  const carrierName = allMvnos.find((c) => c.id === selectedCarrier)?.title || selectedCarrier;

  const filteredPlans = plans.filter((p) => {
    if (filterType && p.type !== filterType) return false;
    if (filterSearch && !p.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

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
    if (!form.name.trim()) { toast("요금제명을 입력해주세요.", "error"); return; }
    if (!form.monthly) { toast("월납부금액을 입력해주세요.", "error"); return; }
    if (!form.type) { toast("유형을 선택해주세요.", "error"); return; }
    if (!form.voice.trim()) { toast("음성을 입력해주세요.", "error"); return; }
    if (!form.sms.trim()) { toast("문자를 입력해주세요.", "error"); return; }
    if (!form.data.trim()) { toast("데이터를 입력해주세요.", "error"); return; }

    if (modal === "create") {
      const res = await createPlan({ carrierId: selectedCarrier, ...form, type: form.type as "postpaid" | "prepaid" });
      if (!res.ok) { toast(res.error || "오류가 발생했습니다.", "error"); return; }
    } else if (modal === "edit" && editing) {
      await updatePlan(editing.id, { ...form, type: form.type as "postpaid" | "prepaid" });
    }
    setModal(null);
    loadPlans();
  };

  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) { toast("삭제할 요금제를 선택해주세요.", "error"); return; }
    if (!confirm(`${checkedIds.size}건의 요금제를 삭제합니다.`)) return;
    for (const id of checkedIds) {
      await deletePlan(id);
    }
    setCheckedIds(new Set());
    loadPlans();
  };

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCheckAll = () => {
    if (checkedIds.size === filteredPlans.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredPlans.map((p) => p.id)));
    }
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
        <Link href="/admin/applications" className={styles.tabLink}><span className={styles.tabIcon}>📋</span><span className={styles.tabLabel}>신청서</span></Link>
        <Link href="/admin/notices" className={styles.tabLink}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>요금제 관리</h1>
          <button className={styles.addBtn} onClick={openCreate}>+ 추가</button>
        </div>

        {/* 필터 영역 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>통신사</label>
            <select
              style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }}
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
            >
              <option value="" disabled>선택하세요</option>
              {allMvnos.map((mvno) => (
                <option key={mvno.id} value={mvno.id}>{mvno.title}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "0 0 140px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>유형</label>
            <select
              style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "white" }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">전체</option>
              <option value="postpaid">후불</option>
              <option value="prepaid">선불</option>
            </select>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>검색</label>
            <input
              type="text"
              placeholder="요금제명 검색"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "2px solid #E8ECF1", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
            />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)", padding: "10px 0" }}>
            {filteredPlans.length}건
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : filteredPlans.length === 0 ? (
          <div className={styles.empty}>{filterSearch || filterType ? "검색 결과가 없습니다." : `${carrierName}에 등록된 요금제가 없습니다.`}</div>
        ) : (
          <>
            {/* 일괄 삭제 바 */}
            {checkedIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", marginBottom: 12, background: "#FEF2F2", borderRadius: 12, border: "1px solid #FECACA" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>{checkedIds.size}건 선택됨</span>
                <button onClick={handleBulkDelete} style={{ padding: "8px 16px", background: "#DC2626", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>선택 삭제</button>
              </div>
            )}

            {/* Desktop Table */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={checkedIds.size === filteredPlans.length && filteredPlans.length > 0} onChange={toggleCheckAll} /></th>
                  <th>요금제명</th><th>월납부금액</th><th>기본료</th><th>할인</th><th>유형</th><th>데이터</th><th>음성</th><th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((p) => (
                  <tr key={p.id} onClick={() => openEdit(p)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={checkedIds.has(p.id)} onChange={() => toggleCheck(p.id)} /></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(p.monthly)}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(p.base_fee)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{fmt(p.discount)}</td>
                    <td>{p.type === "postpaid" ? "후불" : "선불"}</td>
                    <td>{p.data}</td>
                    <td>{p.voice}</td>
                    <td>{p.is_active ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className={styles.cardList}>
              {filteredPlans.map((p) => (
                <div key={p.id} className={styles.card} onClick={() => openEdit(p)} style={{ cursor: "pointer" }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle} style={{ gap: 8 }}>
                      <input type="checkbox" checked={checkedIds.has(p.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleCheck(p.id)} />
                      {p.name}
                    </div>
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
