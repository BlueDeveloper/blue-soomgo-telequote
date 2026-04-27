"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useToast } from "@/components/Toast";
import { fetchCarrierTree, fetchPlans, createApplication } from "@/lib/api";
import { formatPhone, formatBirth, isValidBirth } from "@/lib/utils";
import type { Carrier, Plan } from "@/types";
import styles from "./page.module.css";

const TOTAL_STEPS = 5; // 대분류 → 알뜰폰 → 요금제 → 정보 → 확인

function FormContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialCarrier = searchParams.get("carrier") || "";

  const [step, setStep] = useState(initialCarrier ? 3 : 1);
  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMno, setSelectedMno] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState(initialCarrier);
  const [carrierPaymentType, setCarrierPaymentType] = useState<"postpaid" | "prepaid" | "both">("both");

  // 요금제
  const [paymentType, setPaymentType] = useState<"postpaid" | "prepaid">("postpaid");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  // 신청서 정보
  const [formData, setFormData] = useState({
    usimSerial: "",
    customerType: "" as string,
    contactNumber: "",
    subscriberName: "",
    birthDate: "",
    idNumber: "",
    nationality: "대한민국",
    address: "",
    addressDetail: "",
    activationType: "" as string,
    desiredNumber: "",
    storeName: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // 트리 로드
  useEffect(() => {
    fetchCarrierTree().then((data) => {
      setTree(data);
      // URL에서 carrier가 왔으면 대분류 자동 선택 + 요금제 탭으로
      if (initialCarrier) {
        const parent = data.find(m => m.children?.some(c => c.id === initialCarrier));
        if (parent) {
          setSelectedMno(parent.id);
          const mvno = parent.children?.find(c => c.id === initialCarrier);
          if (mvno) {
            const pt = mvno.payment_type || "both";
            setCarrierPaymentType(pt);
            setPaymentType(pt === "prepaid" ? "prepaid" : "postpaid");
          }
        }
      }
    }).catch(() => {});
  }, [initialCarrier]);

  const mvnoList = tree.find(m => m.id === selectedMno)?.children || [];

  // 요금제 로드 (통신사 변경 시)
  const loadPlans = useCallback(async (carrierId: string) => {
    if (!carrierId) return;
    setPlansLoading(true);
    const data = await fetchPlans(carrierId);
    setAllPlans(data);
    setPlansLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCarrier) loadPlans(selectedCarrier);
  }, [selectedCarrier, loadPlans]);

  // 필터링된 요금제
  const filteredPlans = useMemo(() => {
    return allPlans.filter((p) => p.type === paymentType);
  }, [allPlans, paymentType]);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedMno !== "";
      case 2: return selectedCarrier !== "";
      case 3: return selectedPlan !== null;
      case 4: return formData.subscriberName !== "" && formData.contactNumber !== "" && formData.birthDate !== "";
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    switch (step) {
      case 1: if (!selectedMno) { toast("통신망을 선택해주세요.", "error"); return; } break;
      case 2: if (!selectedCarrier) { toast("알뜰폰 통신사를 선택해주세요.", "error"); return; } break;
      case 3: if (!selectedPlan) { toast("요금제를 선택해주세요.", "error"); return; } break;
      case 4:
        if (!formData.subscriberName.trim()) { toast("가입자명을 입력해주세요.", "error"); return; }
        if (!formData.contactNumber.trim()) { toast("개통번호 연락번호를 입력해주세요.", "error"); return; }
        if (!formData.birthDate.trim()) { toast("생년월일을 입력해주세요.", "error"); return; }
        if (!isValidBirth(formData.birthDate.replace(/[^0-9]/g, ""))) { toast("생년월일 형식이 올바르지 않습니다. (YYYYMMDD)", "error"); return; }
        if (!formData.customerType) { toast("고객유형을 선택해주세요.", "error"); return; }
        if (!formData.activationType) { toast("개통구분을 선택해주세요.", "error"); return; }
        break;
    }
    if (step === TOTAL_STEPS) {
      // DB에 신청서 저장
      await createApplication({
        carrierId: selectedCarrier,
        carrierName,
        planName: selectedPlan?.name || "",
        planMonthly: selectedPlan?.monthly || 0,
        paymentType,
        ...formData,
      });
      setSubmitted(true);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const mnoName = tree.find(m => m.id === selectedMno)?.title || "";
  const carrierName = mvnoList.find((c) => c.id === selectedCarrier)?.title || selectedCarrier;
  const stepLabels = ["통신망", "통신사", "요금제", "정보", "확인"];
  const formatPrice = (n: number) => n.toLocaleString() + "원";

  if (submitted) {
    return (
      <>
        <Header />
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={`${styles.formCard} fadeIn`}>
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
                    <span className={styles.completeInfoLabel}>요금제</span>
                    <span className={styles.completeInfoValue}>{selectedPlan?.name}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>월 요금</span>
                    <span className={styles.completeInfoValue}>{selectedPlan ? formatPrice(selectedPlan.monthly) : ""}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>가입자명</span>
                    <span className={styles.completeInfoValue}>{formData.subscriberName}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>생년월일</span>
                    <span className={styles.completeInfoValue}>{formData.birthDate}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>연락처</span>
                    <span className={styles.completeInfoValue}>{formData.contactNumber}</span>
                  </div>
                  <div className={styles.completeInfoRow}>
                    <span className={styles.completeInfoLabel}>고객유형</span>
                    <span className={styles.completeInfoValue}>{formData.customerType}</span>
                  </div>
                </div>
                <div className={styles.completeActions}>
                  <Link href="/" className={styles.btnHome}>홈으로</Link>
                  <button className={styles.btnPrint} onClick={() => window.print()}>🖨️ 신청서 출력하기</button>
                </div>
              </div>
            </div>

            {/* 인쇄 전용 양식 */}
            {(() => {
              const mvnoData = tree.flatMap(m => m.children || []).find(c => c.id === selectedCarrier);
              const templateImg = mvnoData?.form_template;
              return (
                <div className={styles.printOnly}>
                  {templateImg ? (
                    /* 양식 이미지 배경 + 오버레이 */
                    <div style={{ position: "relative" }}>
                      <img src={templateImg} alt="양식" style={{ width: "100%", display: "block" }} />
                    </div>
                  ) : (
                    /* 기본 양식 */
                    <>
                      <div className={styles.printHeader}>
                        <h1>이동통신 가입신청서</h1>
                        <p>{carrierName} · {paymentType === "postpaid" ? "후불" : "선불"}</p>
                      </div>
                      <table className={styles.printTable}>
                        <tbody>
                          <tr><td className={styles.printLabel}>가입자명</td><td>{formData.subscriberName}</td><td className={styles.printLabel}>생년월일</td><td>{formData.birthDate}</td></tr>
                          <tr><td className={styles.printLabel}>연락처</td><td>{formData.contactNumber}</td><td className={styles.printLabel}>고객유형</td><td>{formData.customerType}</td></tr>
                          <tr><td className={styles.printLabel}>신분증번호</td><td>{formData.idNumber}</td><td className={styles.printLabel}>국적</td><td>{formData.nationality}</td></tr>
                          <tr><td className={styles.printLabel}>주소</td><td colSpan={3}>{formData.address} {formData.addressDetail}</td></tr>
                          <tr><td className={styles.printLabel}>통신사</td><td>{carrierName}</td><td className={styles.printLabel}>개통구분</td><td>{formData.activationType}</td></tr>
                          <tr><td className={styles.printLabel}>요금제</td><td>{selectedPlan?.name}</td><td className={styles.printLabel}>월 요금</td><td>{selectedPlan ? formatPrice(selectedPlan.monthly) : ""}</td></tr>
                          <tr><td className={styles.printLabel}>USIM 일련번호</td><td>{formData.usimSerial}</td><td className={styles.printLabel}>희망번호</td><td>{formData.desiredNumber}</td></tr>
                          <tr><td className={styles.printLabel}>판매점명</td><td colSpan={3}>{formData.storeName}</td></tr>
                        </tbody>
                      </table>
                      <div className={styles.printSignature}>
                        <p>위 내용이 사실과 다름없음을 확인합니다.</p>
                        <div className={styles.printSignRow}>
                          <span>신청일: {new Date().toLocaleDateString("ko-KR")}</span>
                          <span>신청인: {formData.subscriberName} (서명)</span>
                        </div>
                      </div>
                      <div className={styles.printFooter}>hlmobile · 출처: hlmobile.pages.dev</div>
                    </>
                  )}
                </div>
              );
            })()}
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
                <div className={`${styles.progressDot} ${i + 1 === step ? styles.progressDotActive : ""} ${i + 1 < step ? styles.progressDotDone : ""}`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className={`${styles.progressLabel} ${i + 1 === step ? styles.progressLabelActive : ""}`}>{label}</span>
                {i < stepLabels.length - 1 && <div className={`${styles.progressLine} ${i + 1 < step ? styles.progressLineDone : ""}`} />}
              </div>
            ))}
          </div>

          <div className={`${styles.formCard} fadeIn`}>
            {/* Step 1: 대분류(통신망) 선택 */}
            {step === 1 && (
              <>
                <h2 className={styles.formTitle}>통신망을 선택하세요</h2>
                <p className={styles.formDesc}>어떤 통신망의 알뜰폰 신청서가 필요한가요?</p>
                <div className={styles.carrierGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {tree.length === 0
                    ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)
                    : tree.map((mno, i) => (
                    <div
                      key={mno.id}
                      className={`${styles.carrierCard} ${selectedMno === mno.id ? styles.carrierCardActive : ""} fadeIn`}
                      onClick={() => { setSelectedMno(mno.id); setSelectedCarrier(""); setSelectedPlan(null); setAllPlans([]); }}
                      style={{ minHeight: 110, animationDelay: `${i * 0.08}s` }}
                    >
                      <div className={styles.carrierCardIcon} style={{ fontSize: 32 }}>
                        {mno.icon.startsWith("http") || mno.icon.startsWith("/") ? (
                          <img src={mno.icon} alt={mno.title} style={{ width: 32, height: 32, objectFit: "contain" }} />
                        ) : mno.icon}
                      </div>
                      <div className={styles.carrierCardTitle} style={{ fontSize: 16 }}>{mno.title}</div>
                      <div className={styles.carrierCardDesc}>알뜰폰 {mno.children?.length || 0}개</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: 알뜰폰(MVNO) 선택 */}
            {step === 2 && (
              <>
                <h2 className={styles.formTitle}>{mnoName} 알뜰폰을 선택하세요</h2>
                <p className={styles.formDesc}>{mnoName} 망을 사용하는 알뜰폰 통신사를 선택해주세요.</p>
                <div className={styles.carrierGrid}>
                  {mvnoList.map((c, i) => (
                    <div
                      key={c.id}
                      className={`${styles.carrierCard} ${selectedCarrier === c.id ? styles.carrierCardActive : ""} fadeIn`}
                      onClick={() => {
                        setSelectedCarrier(c.id); setSelectedPlan(null); setAllPlans([]);
                        const pt = c.payment_type || "both";
                        setCarrierPaymentType(pt);
                        setPaymentType(pt === "prepaid" ? "prepaid" : "postpaid");
                      }}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className={styles.carrierCardIcon} style={{ width: "100%", height: 48, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                        {c.icon.startsWith("http") || c.icon.startsWith("/") ? (
                          <img src={c.icon} alt={c.title} style={{ maxWidth: "80%", maxHeight: 44, objectFit: "contain" }} />
                        ) : <span style={{ fontSize: 32 }}>{c.icon}</span>}
                      </div>
                      <div className={styles.carrierCardTitle}>{c.title}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: 신청 유형 + 요금제 */}
            {step === 3 && (
              <>
                <h2 className={styles.formTitle}>요금제를 선택하세요</h2>
                <p className={styles.formDesc}>{carrierName} 요금제를 선택해주세요.</p>

                <div className={styles.planSection}>

                  {/* 후불/선불 토글 — payment_type에 따라 표시 */}
                  {carrierPaymentType === "both" ? (
                    <div className={styles.paymentToggle}>
                      <button className={`${styles.toggleBtn} ${paymentType === "postpaid" ? styles.toggleBtnActive : ""}`} onClick={() => { setPaymentType("postpaid"); setSelectedPlan(null); }}>후불</button>
                      <button className={`${styles.toggleBtn} ${paymentType === "prepaid" ? styles.toggleBtnActive : ""}`} onClick={() => { setPaymentType("prepaid"); setSelectedPlan(null); }}>선불</button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16, padding: "10px 16px", background: "var(--brand-light)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--brand)" }}>
                      {carrierPaymentType === "postpaid" ? "후불제" : "선불제"} 요금제
                    </div>
                  )}

                  {selectedPlan && (
                    <div className={styles.selectedPlan}>
                      <div>
                        <div className={styles.selectedPlanLabel}>선택된 요금제</div>
                        <div className={styles.selectedPlanName}>{selectedPlan.name}</div>
                      </div>
                      <div className={styles.selectedPlanPrice}>{formatPrice(selectedPlan.monthly)}/월</div>
                      <span className={styles.selectedPlanRemove} onClick={() => setSelectedPlan(null)}>✕</span>
                    </div>
                  )}

                  {/* Desktop Table */}
                  <div className={styles.planTableWrapper}>
                    {plansLoading ? (
                      <div className={styles.noPlans}>요금제를 불러오는 중...</div>
                    ) : filteredPlans.length > 0 ? (
                      <table className={styles.planTable}>
                        <thead>
                          <tr>
                            <th>요금제명 <span className={styles.sortIcon}>⇅</span></th>
                            <th>월납부금액 <span className={styles.sortIcon}>⇅</span></th>
                            <th>기본료 <span className={styles.sortIcon}>⇅</span></th>
                            <th>프로모션할인 <span className={styles.sortIcon}>⇅</span></th>
                            <th>음성</th>
                            <th>문자</th>
                            <th>데이터</th>
                            <th>QOS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlans.map((plan) => (
                            <tr key={plan.id} className={selectedPlan?.id === plan.id ? styles.planRowActive : ""} onClick={() => setSelectedPlan(plan)}>
                              <td><span className={styles.planName}>{plan.name}</span></td>
                              <td>{formatPrice(plan.monthly)}</td>
                              <td>{formatPrice(plan.base_fee)}</td>
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
                      <div className={styles.noPlans}>해당 조건의 요금제가 없습니다. 통신사 또는 결제 유형을 변경해주세요.</div>
                    )}
                  </div>

                  {/* Mobile Cards */}
                  <div className={styles.planCardList}>
                    {plansLoading ? (
                      <div className={styles.noPlans}>요금제를 불러오는 중...</div>
                    ) : filteredPlans.length > 0 ? filteredPlans.map((plan) => (
                      <div key={plan.id} className={`${styles.planCard} ${selectedPlan?.id === plan.id ? styles.planCardActive : ""}`} onClick={() => setSelectedPlan(plan)}>
                        <div className={styles.planCardName}>{plan.name}</div>
                        <div className={styles.planCardGrid}>
                          <div className={styles.planCardItem}>
                            <span className={styles.planCardItemLabel}>월 요금</span>
                            <span className={`${styles.planCardItemValue} ${styles.planCardPrice}`}>{formatPrice(plan.monthly)}</span>
                          </div>
                          <div className={styles.planCardItem}>
                            <span className={styles.planCardItemLabel}>할인</span>
                            <span className={`${styles.planCardItemValue} ${styles.planCardDiscount}`}>{formatPrice(plan.discount)}</span>
                          </div>
                          <div className={styles.planCardItem}>
                            <span className={styles.planCardItemLabel}>데이터</span>
                            <span className={styles.planCardItemValue}>{plan.data}</span>
                          </div>
                          <div className={styles.planCardItem}>
                            <span className={styles.planCardItemLabel}>음성</span>
                            <span className={styles.planCardItemValue}>{plan.voice}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className={styles.noPlans}>해당 조건의 요금제가 없습니다.</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: 신청서 정보 입력 */}
            {step === 4 && (
              <>
                <h2 className={styles.formTitle}>신청서 정보를 입력하세요</h2>
                <p className={styles.formDesc}>신청서에 기재될 정보를 입력해주세요.</p>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>USIM 일련번호</label>
                    <input type="text" className={styles.input} placeholder="USIM 일련번호" value={formData.usimSerial} onChange={(e) => setFormData({ ...formData, usimSerial: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>고객유형<span className={styles.fieldRequired}>*</span></label>
                    <select className={styles.select} value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}>
                      <option value="" disabled>선택하세요</option>
                      <option value="개인">개인</option>
                      <option value="외국인">외국인</option>
                      <option value="청소년">청소년</option>
                      <option value="개인사업자">개인사업자</option>
                      <option value="법인사업자">법인사업자</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>가입자명<span className={styles.fieldRequired}>*</span></label>
                    <input type="text" className={styles.input} placeholder="홍길동" value={formData.subscriberName} onChange={(e) => setFormData({ ...formData, subscriberName: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>개통번호 연락번호<span className={styles.fieldRequired}>*</span></label>
                    <input type="tel" className={styles.input} placeholder="010-0000-0000" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: formatPhone(e.target.value) })} />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>생년월일<span className={styles.fieldRequired}>*</span></label>
                    <input type="text" className={styles.input} placeholder="YYYYMMDD" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: formatBirth(e.target.value) })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>신분증번호/여권번호</label>
                    <input type="text" className={styles.input} placeholder="신분증 또는 여권 번호" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>국적</label>
                    <input type="text" className={styles.input} placeholder="대한민국" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>개통구분</label>
                    <select className={styles.select} value={formData.activationType} onChange={(e) => setFormData({ ...formData, activationType: e.target.value })}>
                      <option value="" disabled>선택하세요</option>
                      <option value="신규가입">신규가입</option>
                      <option value="번호이동">번호이동</option>
                      <option value="기기변경">기기변경</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>주소</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" className={styles.input} placeholder="주소 검색을 눌러주세요" value={formData.address} readOnly style={{ flex: 1, cursor: "pointer", background: "#F8FAFC" }} onClick={() => {
                      if (typeof window !== "undefined") {
                        const script = document.getElementById("daum-postcode");
                        const run = () => {
                          new (window as unknown as Record<string, unknown> & { daum: { Postcode: new (opts: Record<string, unknown>) => { open: () => void } } }).daum.Postcode({
                            oncomplete: (data: { address: string; zonecode: string }) => {
                              setFormData((prev) => ({ ...prev, address: `(${data.zonecode}) ${data.address}` }));
                            },
                          }).open();
                        };
                        if (script) { run(); } else {
                          const s = document.createElement("script");
                          s.id = "daum-postcode";
                          s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
                          s.onload = run;
                          document.head.appendChild(s);
                        }
                      }
                    }} />
                    <button type="button" onClick={() => {
                      const el = document.querySelector<HTMLInputElement>(`input[placeholder="주소 검색을 눌러주세요"]`);
                      el?.click();
                    }} style={{ padding: "0 20px", background: "var(--brand)", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                      주소 검색
                    </button>
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>상세주소</label>
                  <input type="text" className={styles.input} placeholder="상세주소를 입력하세요" value={formData.addressDetail} onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })} />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>희망번호</label>
                    <input type="text" className={styles.input} placeholder="010-XXXX-XXXX" value={formData.desiredNumber} onChange={(e) => setFormData({ ...formData, desiredNumber: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>판매점명</label>
                    <input type="text" className={styles.input} placeholder="판매점명" value={formData.storeName} onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Step 5: 확인 */}
            {step === 5 && (
              <>
                <h2 className={styles.formTitle}>신청서 내용을 확인하세요</h2>
                <p className={styles.formDesc}>아래 내용이 맞는지 확인 후 출력 버튼을 눌러주세요.</p>
                <div className={styles.completeInfo}>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>통신망</span><span className={styles.completeInfoValue}>{mnoName}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>통신사</span><span className={styles.completeInfoValue}>{carrierName}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>개통구분</span><span className={styles.completeInfoValue}>{formData.activationType}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>결제 방식</span><span className={styles.completeInfoValue}>{paymentType === "postpaid" ? "후불" : "선불"}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>요금제</span><span className={styles.completeInfoValue}>{selectedPlan?.name}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>월 요금</span><span className={styles.completeInfoValue}>{selectedPlan ? formatPrice(selectedPlan.monthly) : ""}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>가입자명</span><span className={styles.completeInfoValue}>{formData.subscriberName}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>생년월일</span><span className={styles.completeInfoValue}>{formData.birthDate}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>연락처</span><span className={styles.completeInfoValue}>{formData.contactNumber}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>고객유형</span><span className={styles.completeInfoValue}>{formData.customerType}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>개통구분</span><span className={styles.completeInfoValue}>{formData.activationType}</span></div>
                  {formData.usimSerial && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>USIM</span><span className={styles.completeInfoValue}>{formData.usimSerial}</span></div>}
                  {formData.address && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>주소</span><span className={styles.completeInfoValue}>{formData.address} {formData.addressDetail}</span></div>}
                  {formData.desiredNumber && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>희망번호</span><span className={styles.completeInfoValue}>{formData.desiredNumber}</span></div>}
                  {formData.storeName && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>판매점</span><span className={styles.completeInfoValue}>{formData.storeName}</span></div>}
                </div>
              </>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              {step > 1 && <button className={styles.btnBack} onClick={handleBack}>이전</button>}
              {step < TOTAL_STEPS ? (
                <button className={`${styles.btnNext} ${!canProceed() ? styles.btnNextDisabled : ""}`} onClick={handleNext}>다음</button>
              ) : (
                <button className={styles.btnSubmit} onClick={handleNext}>🖨️ 신청서 완성 및 출력</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>불러오는 중...</div>}>
      <FormContent />
    </Suspense>
  );
}
