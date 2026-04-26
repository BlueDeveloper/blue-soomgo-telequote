"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApplications, deleteApplication } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Application } from "@/types";
import styles from "../page.module.css";

export default function AdminApplicationsPage() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<Application | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.push("/admin"); return; }
    setLoading(true);
    const data = await fetchApplications();
    setApps(data);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleBulkDelete = async () => {
    if (checkedIds.size === 0) { toast("삭제할 신청서를 선택해주세요.", "error"); return; }
    if (!confirm(`${checkedIds.size}건의 신청서를 삭제합니다.`)) return;
    for (const id of checkedIds) { await deleteApplication(id); }
    setCheckedIds(new Set());
    load();
  };

  const toggleCheck = (id: number) => { setCheckedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const toggleCheckAll = () => { checkedIds.size === apps.length ? setCheckedIds(new Set()) : setCheckedIds(new Set(apps.map((a) => a.id))); };
  const handleLogout = () => { sessionStorage.removeItem("admin_token"); router.push("/admin"); };
  const fmt = (n: number) => n.toLocaleString() + "원";

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><span className={styles.sidebarLogoIcon}>H</span>관리자</div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin/carriers" className={styles.sidebarLink}>📱 통신사</Link>
          <Link href="/admin/plans" className={styles.sidebarLink}>💰 요금제</Link>
          <Link href="/admin/applications" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>📋 신청서</Link>
          <Link href="/admin/notices" className={styles.sidebarLink}>📢 공지사항</Link>
          <Link href="/admin/inquiries" className={styles.sidebarLink}>💬 문의</Link>
        </nav>
        <div className={styles.sidebarLogout}><button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button></div>
      </aside>

      <nav className={styles.bottomTab}>
        <Link href="/admin/carriers" className={styles.tabLink}><span className={styles.tabIcon}>📱</span><span className={styles.tabLabel}>통신사</span></Link>
        <Link href="/admin/plans" className={styles.tabLink}><span className={styles.tabIcon}>💰</span><span className={styles.tabLabel}>요금제</span></Link>
        <Link href="/admin/applications" className={`${styles.tabLink} ${styles.tabLinkActive}`}><span className={styles.tabIcon}>📋</span><span className={styles.tabLabel}>신청서</span></Link>
        <Link href="/admin/notices" className={styles.tabLink}><span className={styles.tabIcon}>📢</span><span className={styles.tabLabel}>공지</span></Link>
        <Link href="/admin/inquiries" className={styles.tabLink}><span className={styles.tabIcon}>💬</span><span className={styles.tabLabel}>문의</span></Link>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>신청서 관리</h1>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>{apps.length}건</span>
        </div>

        {loading ? <div className={styles.empty}>불러오는 중...</div> : apps.length === 0 ? <div className={styles.empty}>신청서가 없습니다.</div> : (
          <>
            {checkedIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", marginBottom: 12, background: "#FEF2F2", borderRadius: 12, border: "1px solid #FECACA" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>{checkedIds.size}건 선택됨</span>
                <button onClick={handleBulkDelete} style={{ padding: "8px 16px", background: "#DC2626", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>선택 삭제</button>
              </div>
            )}
            <table className={styles.table}>
              <thead><tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={checkedIds.size === apps.length && apps.length > 0} onChange={toggleCheckAll} /></th>
                <th>가입자</th><th>통신사</th><th>요금제</th><th>고객유형</th><th>개통구분</th><th>연락처</th><th>신청일</th>
              </tr></thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} onClick={() => setDetail(a)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={checkedIds.has(a.id)} onChange={() => toggleCheck(a.id)} /></td>
                    <td style={{ fontWeight: 600 }}>{a.subscriber_name}</td>
                    <td>{a.carrier_name}</td>
                    <td>{a.plan_name}</td>
                    <td>{a.customer_type}</td>
                    <td>{a.activation_type}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{a.contact_number}</td>
                    <td style={{ fontSize: 12, color: "var(--text-3)" }}>{a.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.cardList}>
              {apps.map((a) => (
                <div key={a.id} className={styles.card} onClick={() => setDetail(a)} style={{ cursor: "pointer" }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle} style={{ gap: 8 }}>
                      <input type="checkbox" checked={checkedIds.has(a.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleCheck(a.id)} />
                      {a.subscriber_name}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>{a.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardField}><span className={styles.cardFieldLabel}>통신사</span><span className={styles.cardFieldValue}>{a.carrier_name}</span></div>
                    <div className={styles.cardField}><span className={styles.cardFieldLabel}>요금제</span><span className={styles.cardFieldValue}>{a.plan_name}</span></div>
                    <div className={styles.cardField}><span className={styles.cardFieldLabel}>연락처</span><span className={styles.cardFieldValue}>{a.contact_number}</span></div>
                    <div className={styles.cardField}><span className={styles.cardFieldLabel}>개통구분</span><span className={styles.cardFieldValue}>{a.activation_type}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 상세 모달 */}
        {detail && (
          <div className={styles.overlay} onClick={() => setDetail(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>신청서 상세</h2>
                <button className={styles.modalClose} onClick={() => setDetail(null)}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "var(--surface-1)", borderRadius: 12, overflow: "hidden" }}>
                {[
                  ["가입자명", detail.subscriber_name],
                  ["통신사", detail.carrier_name],
                  ["요금제", `${detail.plan_name} (${fmt(detail.plan_monthly)}/월)`],
                  ["고객유형", detail.customer_type],
                  ["개통구분", detail.activation_type],
                  ["결제방식", detail.payment_type === "postpaid" ? "후불" : "선불"],
                  ["연락처", detail.contact_number],
                  ["생년월일", detail.birth_date],
                  ["USIM", detail.usim_serial],
                  ["신분증번호", detail.id_number],
                  ["국적", detail.nationality],
                  ["주소", `${detail.address} ${detail.address_detail}`],
                  ["희망번호", detail.desired_number],
                  ["판매점", detail.store_name],
                  ["신청일", detail.created_at?.slice(0, 19)],
                ].filter(([, v]) => v && v.trim()).map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-light)", fontSize: 14 }}>
                    <span style={{ color: "var(--text-3)" }}>{label}</span>
                    <span style={{ color: "var(--text-0)", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
