"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./page.module.css";

/* ===== 통신사 목록 ===== */
const carrierList = [
  { id: "skt", icon: "🔴", title: "SKT", desc: "SK텔레콤" },
  { id: "kt", icon: "🔵", title: "KT", desc: "KT" },
  { id: "lgu", icon: "🟣", title: "LG U+", desc: "LG유플러스" },
  { id: "smartel", icon: "📱", title: "스마텔", desc: "SKT 알뜰폰" },
  { id: "ktm", icon: "📱", title: "KT M모바일", desc: "KT 알뜰폰" },
  { id: "livm", icon: "📱", title: "리브엠", desc: "KT 알뜰폰" },
  { id: "hello", icon: "📱", title: "헬로모바일", desc: "LGU+ 알뜰폰" },
  { id: "sk7", icon: "📱", title: "SK 7mobile", desc: "SKT 알뜰폰" },
  { id: "uplusalddl", icon: "📱", title: "U+알뜰모바일", desc: "LGU+ 알뜰폰" },
];

/* ===== 신청 유형 ===== */
const formTypes = [
  { id: "new", title: "신규 가입", desc: "새 번호로 개통" },
  { id: "mnp", title: "번호이동", desc: "기존 번호 유지하며 통신사 변경" },
  { id: "device", title: "기기변경", desc: "같은 통신사에서 단말기만 교체" },
  { id: "cancel", title: "해지", desc: "회선 해지 신청" },
];

/* ===== 요금제 샘플 데이터 ===== */
interface Plan {
  name: string;
  monthly: number;
  baseFee: number;
  discount: number;
  voice: string;
  sms: string;
  data: string;
  qos: string;
  type: "postpaid" | "prepaid";
  carrier: string;
}

const samplePlans: Plan[] = [
  // 스마텔 선불
  { name: "BAND 데이터 안심 300", monthly: 36000, baseFee: 36000, discount: 0, voice: "기본제공 + (부가통화 50분)", sms: "기본제공", data: "300MB", qos: "최대 3Mbps 무제한", type: "prepaid", carrier: "smartel" },
  { name: "BAND 데이터 15GB+", monthly: 39000, baseFee: 39000, discount: 0, voice: "100분 (부가통화 없음)", sms: "100건", data: "15GB", qos: "최대 3Mbps 무제한", type: "prepaid", carrier: "smartel" },
  { name: "BAND 데이터 퍼펙트", monthly: 59900, baseFee: 59900, discount: 0, voice: "기본제공 + (부가통화 300분)", sms: "기본제공", data: "11GB 소진 후 매일 2GB", qos: "최대 3Mbps 무제한", type: "prepaid", carrier: "smartel" },
  { name: "BAND 데이터 에센스", monthly: 66000, baseFee: 66000, discount: 0, voice: "기본제공 + (부가통화 300분)", sms: "기본제공", data: "100GB", qos: "최대 5Mbps 무제한", type: "prepaid", carrier: "smartel" },
  { name: "PPS Lite", monthly: 3300, baseFee: 3300, discount: 0, voice: "2.64원/초", sms: "22원/건", data: "22.53원/MB", qos: "-", type: "prepaid", carrier: "smartel" },
  { name: "PPS BASIC", monthly: 4950, baseFee: 4950, discount: 0, voice: "2.2원/초", sms: "22원/건", data: "22.53원/MB", qos: "-", type: "prepaid", carrier: "smartel" },
  // SKT 후불
  { name: "5G 다이렉트 59", monthly: 59000, baseFee: 59000, discount: 0, voice: "무제한", sms: "무제한", data: "12GB", qos: "최대 150Mbps", type: "postpaid", carrier: "skt" },
  { name: "5G 다이렉트 69", monthly: 69000, baseFee: 69000, discount: 0, voice: "무제한", sms: "무제한", data: "200GB", qos: "최대 150Mbps", type: "postpaid", carrier: "skt" },
  { name: "T플랜 에센셜", monthly: 55000, baseFee: 55000, discount: 0, voice: "무제한", sms: "무제한", data: "6GB", qos: "최대 10Mbps", type: "postpaid", carrier: "skt" },
  { name: "T플랜 스탠다드", monthly: 69000, baseFee: 69000, discount: 0, voice: "무제한", sms: "무제한", data: "110GB", qos: "최대 300Mbps", type: "postpaid", carrier: "skt" },
  // KT 후불
  { name: "요금제 ON 49", monthly: 49000, baseFee: 49000, discount: 0, voice: "무제한", sms: "무제한", data: "6GB", qos: "최대 10Mbps", type: "postpaid", carrier: "kt" },
  { name: "요금제 ON 59", monthly: 59000, baseFee: 59000, discount: 0, voice: "무제한", sms: "무제한", data: "11GB", qos: "최대 150Mbps", type: "postpaid", carrier: "kt" },
  { name: "요금제 ON 69", monthly: 69000, baseFee: 69000, discount: 0, voice: "무제한", sms: "무제한", data: "200GB", qos: "최대 150Mbps", type: "postpaid", carrier: "kt" },
  // LG U+ 후불
  { name: "U+ 다이렉트 49", monthly: 49000, baseFee: 49000, discount: 0, voice: "무제한", sms: "무제한", data: "6GB", qos: "최대 10Mbps", type: "postpaid", carrier: "lgu" },
  { name: "U+ 다이렉트 59", monthly: 59000, baseFee: 59000, discount: 0, voice: "무제한", sms: "무제한", data: "12GB", qos: "최대 150Mbps", type: "postpaid", carrier: "lgu" },
  { name: "U+ 시그니처 79", monthly: 79000, baseFee: 79000, discount: 0, voice: "무제한", sms: "무제한", data: "무제한", qos: "최대 300Mbps", type: "postpaid", carrier: "lgu" },
];

const TOTAL_STEPS = 4;

export default function FormPage() {
  const [step, setStep] = useState(1);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedFormType, setSelectedFormType] = useState("");

  // 요금제 선택
  const [paymentType, setPaymentType] = useState<"postpaid" | "prepaid">("postpaid");
  const [planSearch, setPlanSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // 개인정보
  const [formData, setFormData] = useState({
    name: "",
    birth: "",
    phone: "",
    idType: "주민등록증",
    idNumber: "",
    address: "",
    device: "",
    memo: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // 현재 통신사에 맞는 요금제 필터링
  const filteredPlans = useMemo(() => {
    return samplePlans.filter((p) => {
      if (p.carrier !== selectedCarrier) return false;
      if (p.type !== paymentType) return false;
      if (planSearch && !p.name.toLowerCase().includes(planSearch.toLowerCase())) return false;
      return true;
    });
  }, [selectedCarrier, paymentType, planSearch]);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedCarrier !== "";
      case 2: return selectedFormType !== "" && selectedPlan !== null;
      case 3: return formData.name !== "" && formData.phone !== "" && formData.birth !== "";
      case 4: return true;
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

  const carrierName = carrierList.find((c) => c.id === selectedCarrier)?.title || "";
  const formTypeName = formTypes.find((f) => f.id === selectedFormType)?.title || "";
  const stepLabels = ["통신사", "요금제", "정보입력", "확인"];

  const formatPrice = (n: number) => n.toLocaleString() + "원";

  /* ===== 완료 화면 ===== */
  if (submitted) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.formCard}>
              <div className={styles.complete}>
                <div className={styles.completeIcon}>🖨️</div>
                <h2>신청서가 완성되었습니다!</h2>
                <p>아래 내용을 확인하고 출력하세요.</p>

                <div className={styles.completeInfo}>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>통신사</span>
                    <span className={styles.completeInfoValue}>{carrierName}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>신청 유형</span>
                    <span className={styles.completeInfoValue}>{formTypeName}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>요금제</span>
                    <span className={styles.completeInfoValue}>{selectedPlan?.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>월 요금</span>
                    <span className={styles.completeInfoValue}>
                      {selectedPlan ? formatPrice(selectedPlan.monthly) : ""}
                    </span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>신청자</span>
                    <span className={styles.completeInfoValue}>{formData.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>생년월일</span>
                    <span className={styles.completeInfoValue}>{formData.birth}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>연락처</span>
                    <span className={styles.completeInfoValue}>{formData.phone}</span>
                  </div>
                  {formData.device && (
                    <div className={styles.completeInfoRow}>
                      <span className={styles.completeInfoLabel}>단말기</span>
                      <span className={styles.completeInfoValue}>{formData.device}</span>
                    </div>
                  )}
                </div>

                <div className={styles.completeActions}>
                  <Link href="/" className={styles.btnHome}>홈으로</Link>
                  <button className={styles.btnPrint} onClick={() => window.print()}>
                    🖨️ 신청서 출력하기
                  </button>
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

          <div className={styles.formCard}>
            {/* ===== Step 1: 통신사 선택 ===== */}
            {step === 1 && (
              <>
                <h2 className={styles.formTitle}>통신사를 선택하세요</h2>
                <p className={styles.formDesc}>신청서를 작성할 통신사를 선택해주세요.</p>
                <div className={styles.carrierGrid}>
                  {carrierList.map((c) => (
                    <div
                      key={c.id}
                      className={`${styles.carrierCard} ${
                        selectedCarrier === c.id ? styles.carrierCardActive : ""
                      }`}
                      onClick={() => {
                        setSelectedCarrier(c.id);
                        setSelectedPlan(null);
                      }}
                    >
                      <div className={styles.carrierCardIcon}>{c.icon}</div>
                      <div className={styles.carrierCardTitle}>{c.title}</div>
                      <div className={styles.carrierCardDesc}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ===== Step 2: 신청 유형 + 요금제 선택 (바로폼 스타일) ===== */}
            {step === 2 && (
              <>
                <h2 className={styles.formTitle}>신청 유형과 요금제를 선택하세요</h2>
                <p className={styles.formDesc}>{carrierName} 신청서 양식을 선택하고 요금제를 지정해주세요.</p>

                {/* 신청 유형 */}
                <div className={styles.planSection}>
                  <div className={styles.planSectionTitle}>신청 유형</div>
                  <div className={styles.formTypeGrid}>
                    {formTypes.map((ft) => (
                      <div
                        key={ft.id}
                        className={`${styles.formTypeCard} ${
                          selectedFormType === ft.id ? styles.formTypeCardActive : ""
                        }`}
                        onClick={() => setSelectedFormType(ft.id)}
                      >
                        <div className={styles.formTypeTitle}>{ft.title}</div>
                        <div className={styles.formTypeDesc}>{ft.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 요금제 선택 */}
                <div className={styles.planSection}>
                  <div className={styles.planSectionTitle}>요금제 선택</div>

                  {/* 후불/선불 토글 */}
                  <div className={styles.paymentToggle}>
                    <button
                      className={`${styles.toggleBtn} ${paymentType === "postpaid" ? styles.toggleBtnActive : ""}`}
                      onClick={() => { setPaymentType("postpaid"); setSelectedPlan(null); }}
                    >
                      후불
                    </button>
                    <button
                      className={`${styles.toggleBtn} ${paymentType === "prepaid" ? styles.toggleBtnActive : ""}`}
                      onClick={() => { setPaymentType("prepaid"); setSelectedPlan(null); }}
                    >
                      선불
                    </button>
                  </div>

                  {/* 필터 */}
                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <span className={styles.filterLabel}>통신사</span>
                      <select
                        className={styles.filterSelect}
                        value={selectedCarrier}
                        onChange={(e) => {
                          setSelectedCarrier(e.target.value);
                          setSelectedPlan(null);
                        }}
                      >
                        {carrierList.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <span className={styles.filterLabel}>요금제명</span>
                      <input
                        type="text"
                        className={styles.filterSearch}
                        placeholder="검색할 요금제명"
                        value={planSearch}
                        onChange={(e) => setPlanSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 선택된 요금제 뱃지 */}
                  {selectedPlan && (
                    <div className={styles.selectedPlan}>
                      <div>
                        <div className={styles.selectedPlanLabel}>선택된 요금제</div>
                        <div className={styles.selectedPlanName}>{selectedPlan.name}</div>
                      </div>
                      <div className={styles.selectedPlanPrice}>
                        {formatPrice(selectedPlan.monthly)}/월
                      </div>
                      <span
                        className={styles.selectedPlanRemove}
                        onClick={() => setSelectedPlan(null)}
                      >
                        ✕
                      </span>
                    </div>
                  )}

                  {/* 요금제 테이블 */}
                  <div className={styles.planTableWrapper}>
                    {filteredPlans.length > 0 ? (
                      <table className={styles.planTable}>
                        <thead>
                          <tr>
                            <th>요금제명 <span className={styles.sortIcon}>⇅</span></th>
                            <th>월납부금액 <span className={styles.sortIcon}>⇅</span></th>
                            <th>기본료 <span className={styles.sortIcon}>⇅</span></th>
                            <th>프로모션할인금액 <span className={styles.sortIcon}>⇅</span></th>
                            <th>음성</th>
                            <th>문자</th>
                            <th>데이터</th>
                            <th>QOS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlans.map((plan) => (
                            <tr
                              key={plan.name}
                              className={selectedPlan?.name === plan.name ? styles.planRowActive : ""}
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <td><span className={styles.planName}>{plan.name}</span></td>
                              <td>{formatPrice(plan.monthly)}</td>
                              <td>{formatPrice(plan.baseFee)}</td>
                              <td><span className={styles.planDiscount}>{formatPrice(plan.discount)}</span></td>
                              <td>{plan.voice}</td>
                              <td>{plan.sms}</td>
                              <td>{plan.data}</td>
                              <td>{plan.qos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={styles.noPlans}>
                        해당 조건의 요금제가 없습니다. 통신사 또는 결제 유형을 변경해주세요.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ===== Step 3: 개인정보 입력 ===== */}
            {step === 3 && (
              <>
                <h2 className={styles.formTitle}>신청자 정보를 입력하세요</h2>
                <p className={styles.formDesc}>신청서에 기재될 정보를 입력해주세요.</p>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      이름<span className={styles.fieldRequired}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="홍길동"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      생년월일<span className={styles.fieldRequired}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="YYYYMMDD"
                      value={formData.birth}
                      onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      연락처<span className={styles.fieldRequired}>*</span>
                    </label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>신분증 종류</label>
                    <select
                      className={styles.select}
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    >
                      <option>주민등록증</option>
                      <option>운전면허증</option>
                      <option>여권</option>
                      <option>외국인등록증</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>주소</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="주소를 입력하세요"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>단말기명</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="예: 갤럭시 S25"
                      value={formData.device}
                      onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>비고</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="추가 메모"
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ===== Step 4: 최종 확인 ===== */}
            {step === 4 && (
              <>
                <h2 className={styles.formTitle}>신청서 내용을 확인하세요</h2>
                <p className={styles.formDesc}>아래 내용이 맞는지 확인 후 출력 버튼을 눌러주세요.</p>

                <div className={styles.completeInfo}>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>통신사</span>
                    <span className={styles.completeInfoValue}>{carrierName}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>신청 유형</span>
                    <span className={styles.completeInfoValue}>{formTypeName}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>결제 방식</span>
                    <span className={styles.completeInfoValue}>{paymentType === "postpaid" ? "후불" : "선불"}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>요금제</span>
                    <span className={styles.completeInfoValue}>{selectedPlan?.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>월 요금</span>
                    <span className={styles.completeInfoValue}>
                      {selectedPlan ? formatPrice(selectedPlan.monthly) : ""}
                    </span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>이름</span>
                    <span className={styles.completeInfoValue}>{formData.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>생년월일</span>
                    <span className={styles.completeInfoValue}>{formData.birth}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>연락처</span>
                    <span className={styles.completeInfoValue}>{formData.phone}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>신분증</span>
                    <span className={styles.completeInfoValue}>{formData.idType}</span>
                  </div>
                  {formData.address && (
                    <div className={styles.completeInfoRow}>
                      <span className={styles.completeInfoLabel}>주소</span>
                      <span className={styles.completeInfoValue}>{formData.address}</span>
                    </div>
                  )}
                  {formData.device && (
                    <div className={styles.completeInfoRow}>
                      <span className={styles.completeInfoLabel}>단말기</span>
                      <span className={styles.completeInfoValue}>{formData.device}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              {step > 1 && (
                <button className={styles.btnBack} onClick={handleBack}>이전</button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  className={`${styles.btnNext} ${!canProceed() ? styles.btnNextDisabled : ""}`}
                  onClick={handleNext}
                >
                  다음
                </button>
              ) : (
                <button
                  className={styles.btnSubmit}
                  onClick={handleNext}
                >
                  🖨️ 신청서 완성 및 출력
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
