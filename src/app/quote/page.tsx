"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./page.module.css";

const serviceCategories = [
  { icon: "🔧", title: "설비/배관", desc: "보일러, 수도, 배관" },
  { icon: "⚡", title: "전기/조명", desc: "전기 공사, 조명" },
  { icon: "🏠", title: "인테리어", desc: "도배, 장판, 타일" },
  { icon: "❄️", title: "에어컨/냉난방", desc: "설치, 청소, 수리" },
  { icon: "🚚", title: "이사/운송", desc: "가정, 사무실 이사" },
  { icon: "🧹", title: "청소", desc: "입주, 사무실 청소" },
  { icon: "🔑", title: "잠금/보안", desc: "도어락, CCTV" },
  { icon: "🎨", title: "페인트/도장", desc: "실내외 도장" },
];

const urgencyOptions = ["급해요 (오늘~내일)", "이번 주 내", "1~2주 내", "한 달 내", "아직 정해지지 않았어요"];

const preferredTimes = ["오전 (9~12시)", "오후 (12~18시)", "저녁 (18시 이후)", "주말 오전", "주말 오후", "언제든 가능"];

const TOTAL_STEPS = 4;

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [urgency, setUrgency] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    detail: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedService !== "";
      case 2: return urgency !== "";
      case 3: return preferredTime !== "";
      case 4: return formData.name !== "" && formData.phone !== "";
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step === TOTAL_STEPS) {
      setSubmitted(true);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const stepLabels = ["서비스", "일정", "시간", "정보"];

  if (submitted) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.formCard}>
              <div className={styles.complete}>
                <div className={styles.completeIcon}>✅</div>
                <h2>견적 요청이 완료되었습니다!</h2>
                <p>곧 전문가로부터 전화가 올 예정입니다.</p>
                <p>평균 3분 이내에 첫 번째 견적 전화를 받으실 수 있습니다.</p>

                <div className={styles.completeInfo}>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>서비스</span>
                    <span className={styles.completeInfoValue}>{selectedService}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>희망 일정</span>
                    <span className={styles.completeInfoValue}>{urgency}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>통화 가능 시간</span>
                    <span className={styles.completeInfoValue}>{preferredTime}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>신청자</span>
                    <span className={styles.completeInfoValue}>{formData.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>연락처</span>
                    <span className={styles.completeInfoValue}>{formData.phone}</span>
                  </div>
                </div>

                <div className={styles.completeActions}>
                  <Link href="/" className={styles.btnHome}>홈으로</Link>
                  <Link href="/quote" className={styles.btnAnother}>추가 견적받기</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Progress */}
          <div className={styles.progress}>
            {stepLabels.map((label, i) => (
              <div key={label} className={styles.progressStep}>
                <div
                  className={`${styles.progressDot} ${
                    i + 1 === step ? styles.progressDotActive : ""
                  } ${i + 1 < step ? styles.progressDotDone : ""}`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span
                  className={`${styles.progressLabel} ${
                    i + 1 === step ? styles.progressLabelActive : ""
                  }`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`${styles.progressLine} ${
                      i + 1 < step ? styles.progressLineDone : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className={styles.formCard}>
            {/* Step 1 - Service Selection */}
            {step === 1 && (
              <>
                <h2 className={styles.formTitle}>어떤 서비스가 필요하세요?</h2>
                <p className={styles.formDesc}>견적을 받고 싶은 서비스 분야를 선택해주세요.</p>
                <div className={styles.selectGrid}>
                  {serviceCategories.map((cat) => (
                    <div
                      key={cat.title}
                      className={`${styles.selectCard} ${
                        selectedService === cat.title ? styles.selectCardActive : ""
                      }`}
                      onClick={() => setSelectedService(cat.title)}
                    >
                      <div className={styles.selectCardIcon}>{cat.icon}</div>
                      <div className={styles.selectCardTitle}>{cat.title}</div>
                      <div className={styles.selectCardDesc}>{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 2 - Urgency */}
            {step === 2 && (
              <>
                <h2 className={styles.formTitle}>언제까지 필요하세요?</h2>
                <p className={styles.formDesc}>
                  서비스가 필요한 시기를 선택해주세요. 빠를수록 빠른 견적을 받을 수 있어요.
                </p>
                <div className={styles.radioGroup}>
                  {urgencyOptions.map((opt) => (
                    <div
                      key={opt}
                      className={`${styles.radioOption} ${
                        urgency === opt ? styles.radioOptionActive : ""
                      }`}
                      onClick={() => setUrgency(opt)}
                    >
                      <div
                        className={`${styles.radioDot} ${
                          urgency === opt ? styles.radioDotActive : ""
                        }`}
                      >
                        <div
                          className={`${styles.radioDotInner} ${
                            urgency === opt ? styles.radioDotInnerActive : ""
                          }`}
                        />
                      </div>
                      <span className={styles.radioLabel}>{opt}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 3 - Preferred Time */}
            {step === 3 && (
              <>
                <h2 className={styles.formTitle}>통화 가능한 시간은?</h2>
                <p className={styles.formDesc}>
                  전문가가 전화 드릴 시간대를 선택해주세요.
                </p>
                <div className={styles.timeGrid}>
                  {preferredTimes.map((t) => (
                    <div
                      key={t}
                      className={`${styles.timeChip} ${
                        preferredTime === t ? styles.timeChipActive : ""
                      }`}
                      onClick={() => setPreferredTime(t)}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 4 - Contact Info */}
            {step === 4 && (
              <>
                <h2 className={styles.formTitle}>마지막으로, 연락처를 알려주세요</h2>
                <p className={styles.formDesc}>
                  전문가가 견적 전화를 드리기 위해 필요합니다.
                </p>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    이름<span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="이름을 입력해주세요"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    연락처<span className={styles.fieldRequired}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>주소 (선택)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="서비스 지역을 입력해주세요"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>상세 요청사항 (선택)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="추가로 전달하고 싶은 내용이 있다면 적어주세요"
                    value={formData.detail}
                    onChange={(e) =>
                      setFormData({ ...formData, detail: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              {step > 1 && (
                <button className={styles.btnBack} onClick={handleBack}>
                  이전
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  className={`${styles.btnNext} ${
                    !canProceed() ? styles.btnNextDisabled : ""
                  }`}
                  onClick={handleNext}
                >
                  다음
                </button>
              ) : (
                <button
                  className={`${styles.btnSubmit} ${
                    !canProceed() ? styles.btnNextDisabled : ""
                  }`}
                  onClick={handleNext}
                >
                  📞 무료 견적 요청하기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
