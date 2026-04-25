"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { createInquiry } from "@/lib/api";

export default function InquiryPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", title: "", content: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title || !form.content) { alert("이름, 제목, 내용은 필수입니다."); return; }
    setLoading(true);
    const res = await createInquiry(form);
    setLoading(false);
    if (res.ok) setSubmitted(true);
    else alert(res.error || "등록에 실패했습니다.");
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
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-0)", marginBottom: 8 }}>문의하기</h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 28 }}>궁금한 점이나 요청 사항을 남겨주세요.</p>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-0)", marginBottom: 8 }}>문의가 등록되었습니다</h2>
              <p style={{ fontSize: 14, color: "var(--text-3)" }}>빠른 시일 내에 답변드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: "32px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>이름 *</label>
                  <input style={inputStyle} placeholder="홍길동" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
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

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: 16, background: "var(--brand)", color: "white", borderRadius: 12,
                fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer",
              }}>
                {loading ? "등록 중..." : "문의 등록"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
