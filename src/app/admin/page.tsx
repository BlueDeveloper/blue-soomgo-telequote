"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import styles from "./page.module.css";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(password);
    setLoading(false);

    if (res.ok && res.data) {
      sessionStorage.setItem("admin_token", res.data.token);
      router.push("/admin/carriers");
    } else {
      setError(res.error || "로그인에 실패했습니다");
    }
  };

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <div className={styles.loginLogo}>H</div>
        <h1 className={styles.loginTitle}>관리자 로그인</h1>
        <p className={styles.loginDesc}>hlmobile 관리자 비밀번호를 입력하세요</p>
        <input
          type="password"
          className={styles.loginInput}
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button className={styles.loginBtn} type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {error && <p className={styles.loginError}>{error}</p>}
      </form>
    </div>
  );
}
