"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { createInquiry, searchMyInquiries } from "@/lib/api";
import type { Inquiry } from "@/types";

export default function InquiryPage() {
  const [tab, setTab] = useState<"write" | "check">("write");

  // 등록
  const [form, setForm] = useState({ name: "", phone: "", email: "", title: "", content: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 조회
  const [search, setSearch] = useState({ name: "", phone: "" });
  const [results, setResults] = useState<Inquiry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!form.phone.trim()) { alert("연락처를 입력해주세요."); return; }
    if (!form.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (!form.content.trim()) { alert("내용을 입력해주세요."); return; }
    setLoading(true);
    const res = await createInquiry(form);
    setLoading(false);
    if (res.ok) setSubmitted(true);
    else alert(res.error || "등록에 실패했습니다.");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.name.trim()) { alert("이름을 입력해주세요."); return; }
    if (!search.phone.trim()) { alert("연락처를 입력해주세요."); return; }
    setSearching(true);
    const data = await searchMyInquiries(search.name, search.phone);
    setResults(data);
    setSearching(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 10,
    fontSize: 15, color: "var(--text-0)", outline: "none", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6,
    fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: 0.5,
  };

  return (
    <>
      <Header />
      <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh", background: "var(--surface-1)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-0)", marginBottom: 20 }}>문의하기</h1>

          {/* 탭 */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "white", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
            <button
              onClick={() => setTab("write")}
              style={{ flex: 1, padding: "14px", fontSize: 15, fontWeight: tab === "write" ? 700 : 500, color: tab === "write" ? "var(--brand)" : "var(--text-3)", background: tab === "write" ? "var(--brand-light)" : "white", border: "none", cursor: "pointer", transition: "all 0.2s" }}
            >
              문의 등록
            </button>
            <button
              onClick={() => setTab("check")}
              style={{ flex: 1, padding: "14px", fontSize: 15, fontWeight: tab === "check" ? 700 : 500, color: tab === "check" ? "var(--brand)" : "var(--text-3)", background: tab === "check" ? "var(--brand-light)" : "white", border: "none", cursor: "pointer", borderLeft: "1px solid var(--border)", transition: "all 0.2s" }}
            >
              답변 확인
            </button>
          </div>

          {/* 등록 탭 */}
          {tab === "write" && (
            submitted ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-0)", marginBottom: 8 }}>문의가 등록되었습니다</h2>
                <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 20 }}>빠른 시일 내에 답변드리겠습니다.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", title: "", content: "" }); }} style={{ padding: "10px 24px", background: "var(--surface-2)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--text-1)", cursor: "pointer" }}>
                  추가 문의하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: "32px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>이름 *</label>
                    <input style={inputStyle} placeholder="홍길동" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>연락처 *</label>
                    <input style={inputStyle} placeholder="010-0000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>이메일</label>
                  <input style={inputStyle} type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>제목 *</label>
                  <input style={inputStyle} placeholder="문의 제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>내용 *</label>
                  <textarea style={{ ...inputStyle, minHeight: 150, resize: "vertical" }} placeholder="문의 내용을 입력하세요" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: 16, background: "var(--brand)", color: "white", borderRadius: 12, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {loading ? "등록 중..." : "문의 등록"}
                </button>
              </form>
            )
          )}

          {/* 조회 탭 */}
          {tab === "check" && (
            <div>
              <form onSubmit={handleSearch} style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: "24px" }}>
                <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 16 }}>문의 시 입력한 이름과 연락처로 조회합니다.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>이름</label>
                    <input style={inputStyle} placeholder="홍길동" value={search.name} onChange={(e) => setSearch({ ...search, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>연락처</label>
                    <input style={inputStyle} placeholder="010-0000-0000" value={search.phone} onChange={(e) => setSearch({ ...search, phone: e.target.value })} />
                  </div>
                </div>
                <button type="submit" disabled={searching} style={{ width: "100%", padding: 14, background: "var(--brand)", color: "white", borderRadius: 12, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {searching ? "조회 중..." : "내 문의 조회"}
                </button>
              </form>

              {results !== null && (
                <div style={{ marginTop: 20 }}>
                  {results.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--text-3)", fontSize: 14 }}>조회된 문의가 없습니다.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
                      {results.map((inq, i) => (
                        <div key={inq.id} onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)} style={{ padding: "16px 20px", borderBottom: i < results.length - 1 ? "1px solid var(--border-light)" : "none", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-0)" }}>{inq.title}</span>
                            {inq.reply ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#ECFDF5", color: "#059669" }}>답변완료</span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#FFFBEB", color: "#D97706" }}>대기중</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{inq.created_at?.slice(0, 10)}</div>

                          {expandedId === inq.id && (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ padding: 14, background: "var(--surface-1)", borderRadius: 10, fontSize: 14, color: "var(--text-1)", lineHeight: 1.7, marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>내 문의</div>
                                {inq.content}
                              </div>
                              {inq.reply ? (
                                <div style={{ padding: 14, background: "#EFF6FF", borderRadius: 10, fontSize: 14, color: "var(--text-0)", lineHeight: 1.7, border: "1px solid #BFDBFE" }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>관리자 답변 · {inq.replied_at?.slice(0, 10)}</div>
                                  {inq.reply}
                                </div>
                              ) : (
                                <div style={{ padding: 14, background: "#FFFBEB", borderRadius: 10, fontSize: 14, color: "#92400E", textAlign: "center" }}>
                                  아직 답변이 등록되지 않았습니다.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
