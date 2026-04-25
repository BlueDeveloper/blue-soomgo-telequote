"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { fetchCarrierTree, fetchPlans } from "@/lib/api";
import type { Carrier, Plan } from "@/types";
import styles from "./page.module.css";

const formTypes = [
  { id: "new", title: "신규 가입", desc: "새 번호로 개통" },
  { id: "mnp", title: "번호이동", desc: "기존 번호 유지하며 통신사 변경" },
  { id: "device", title: "기기변경", desc: "같은 통신사에서 단말기만 교체" },
  { id: "cancel", title: "해지", desc: "회선 해지 신청" },
];

const TOTAL_STEPS = 5; // 대분류 → 알뜰폰 → 요금제 → 정보 → 확인

function FormContent() {
  const searchParams = useSearchParams();
  const initialCarrier = searchParams.get("carrier") || "";

  const [step, setStep] = useState(initialCarrier ? 2 : 1);
  const [tree, setTree] = useState<Carrier[]>([]);
  const [selectedMno, setSelectedMno] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState(initialCarrier);
  const [selectedFormType, setSelectedFormType] = useState("");

  // 요금제
  const [paymentType, setPaymentType] = useState<"postpaid" | "prepaid">("postpaid");
  const [planSearch, setPlanSearch] = useState("");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  // 개인정보
  const [formData, setFormData] = useState({
    name: "", birth: "", phone: "", idType: "주민등록증",
    idNumber: "", address: "", device: "", memo: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // 트리 로드
  useEffect(() => {
    fetchCarrierTree().then((data) => {
      setTree(data);
      // URL에서 carrier가 왔으면 대분류 자동 선택
      if (initialCarrier) {
        const parent = data.find(m => m.children?.some(c => c.id === initialCarrier));
        if (parent) setSelectedMno(parent.id);
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
    return allPlans.filter((p) => {
      if (p.type !== paymentType) return false;
      if (planSearch && !p.name.toLowerCase().includes(planSearch.toLowerCase())) return false;
      return true;
    });
  }, [allPlans, paymentType, planSearch]);

  const canProceed = () => {
    switch (step) {
      case 1: return selectedMno !== "";
      case 2: return selectedCarrier !== "";
      case 3: return selectedFormType !== "" && selectedPlan !== null;
      case 4: return formData.name !== "" && formData.phone !== "" && formData.birth !== "";
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step === TOTAL_STEPS) { setSubmitted(true); return; }
    setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const mnoName = tree.find(m => m.id === selectedMno)?.title || "";
  const carrierName = mvnoList.find((c) => c.id === selectedCarrier)?.title || selectedCarrier;
  const formTypeName = formTypes.find((f) => f.id === selectedFormType)?.title || "";
  const stepLabels = ["통신망", "통신사", "요금제", "정보", "확인"];
  const formatPrice = (n: number) => n.toLocaleString() + "원";

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
                    <span className={styles.completeInfoValue}>{selectedPlan ? formatPrice(selectedPlan.monthly) : ""}</span>
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
                  <button className={styles.btnPrint} onClick={() => window.print()}>🖨️ 신청서 출력하기</button>
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
                <div className={`${styles.progressDot} ${i + 1 === step ? styles.progressDotActive : ""} ${i + 1 < step ? styles.progressDotDone : ""}`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className={`${styles.progressLabel} ${i + 1 === step ? styles.progressLabelActive : ""}`}>{label}</span>
                {i < stepLabels.length - 1 && <div className={`${styles.progressLine} ${i + 1 < step ? styles.progressLineDone : ""}`} />}
              </div>
            ))}
          </div>

          <div className={styles.formCard}>
            {/* Step 1: 대분류(통신망) 선택 */}
            {step === 1 && (
              <>
                <h2 className={styles.formTitle}>통신망을 선택하세요</h2>
                <p className={styles.formDesc}>어떤 통신망의 알뜰폰 신청서가 필요한가요?</p>
                <div className={styles.carrierGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {tree.map((mno) => (
                    <div
                      key={mno.id}
                      className={`${styles.carrierCard} ${selectedMno === mno.id ? styles.carrierCardActive : ""}`}
                      onClick={() => { setSelectedMno(mno.id); setSelectedCarrier(""); setSelectedPlan(null); setAllPlans([]); }}
                      style={{ minHeight: 110 }}
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
                  {mvnoList.map((c) => (
                    <div
                      key={c.id}
                      className={`${styles.carrierCard} ${selectedCarrier === c.id ? styles.carrierCardActive : ""}`}
                      onClick={() => { setSelectedCarrier(c.id); setSelectedPlan(null); setAllPlans([]); }}
                    >
                      <div className={styles.carrierCardIcon}>
                        {c.icon.startsWith("http") || c.icon.startsWith("/") ? (
                          <img src={c.icon} alt={c.title} style={{ width: 24, height: 24, objectFit: "contain" }} />
                        ) : c.icon}
                      </div>
                      <div className={styles.carrierCardTitle}>{c.title}</div>
                      <div className={styles.carrierCardDesc}>{c.description}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: 신청 유형 + 요금제 */}
            {step === 3 && (
              <>
                <h2 className={styles.formTitle}>신청 유형과 요금제를 선택하세요</h2>
                <p className={styles.formDesc}>{carrierName} 신청서 양식을 선택하고 요금제를 지정해주세요.</p>

                <div className={styles.planSection}>
                  <div className={styles.planSectionTitle}>신청 유형</div>
                  <div className={styles.formTypeGrid}>
                    {formTypes.map((ft) => (
                      <div key={ft.id} className={`${styles.formTypeCard} ${selectedFormType === ft.id ? styles.formTypeCardActive : ""}`} onClick={() => setSelectedFormType(ft.id)}>
                        <div className={styles.formTypeTitle}>{ft.title}</div>
                        <div className={styles.formTypeDesc}>{ft.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.planSection}>
                  <div className={styles.planSectionTitle}>요금제 선택</div>

                  <div className={styles.paymentToggle}>
                    <button className={`${styles.toggleBtn} ${paymentType === "postpaid" ? styles.toggleBtnActive : ""}`} onClick={() => { setPaymentType("postpaid"); setSelectedPlan(null); }}>후불</button>
                    <button className={`${styles.toggleBtn} ${paymentType === "prepaid" ? styles.toggleBtnActive : ""}`} onClick={() => { setPaymentType("prepaid"); setSelectedPlan(null); }}>선불</button>
                  </div>

                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <span className={styles.filterLabel}>통신사</span>
                      <select className={styles.filterSelect} value={selectedCarrier} onChange={(e) => { setSelectedCarrier(e.target.value); setSelectedPlan(null); }}>
                        {tree.map((mno) => (
                          <optgroup key={mno.id} label={mno.title}>
                            {(mno.children || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <span className={styles.filterLabel}>요금제명</span>
                      <input type="text" className={styles.filterSearch} placeholder="검색할 요금제명" value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} />
                    </div>
                  </div>

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

            {/* Step 4: 개인정보 */}
            {step === 4 && (
              <>
                <h2 className={styles.formTitle}>신청자 정보를 입력하세요</h2>
                <p className={styles.formDesc}>신청서에 기재될 정보를 입력해주세요.</p>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>이름<span className={styles.fieldRequired}>*</span></label>
                    <input type="text" className={styles.input} placeholder="홍길동" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>생년월일<span className={styles.fieldRequired}>*</span></label>
                    <input type="text" className={styles.input} placeholder="YYYYMMDD" value={formData.birth} onChange={(e) => setFormData({ ...formData, birth: e.target.value })} />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>연락처<span className={styles.fieldRequired}>*</span></label>
                    <input type="tel" className={styles.input} placeholder="010-0000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>신분증 종류</label>
                    <select className={styles.select} value={formData.idType} onChange={(e) => setFormData({ ...formData, idType: e.target.value })}>
                      <option>주민등록증</option>
                      <option>운전면허증</option>
                      <option>여권</option>
                      <option>외국인등록증</option>
                    </select>
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>주소</label>
                  <input type="text" className={styles.input} placeholder="주소를 입력하세요" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>단말기명</label>
                    <input type="text" className={styles.input} placeholder="예: 갤럭시 S25" value={formData.device} onChange={(e) => setFormData({ ...formData, device: e.target.value })} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>비고</label>
                    <input type="text" className={styles.input} placeholder="추가 메모" value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} />
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
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>신청 유형</span><span className={styles.completeInfoValue}>{formTypeName}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>결제 방식</span><span className={styles.completeInfoValue}>{paymentType === "postpaid" ? "후불" : "선불"}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>요금제</span><span className={styles.completeInfoValue}>{selectedPlan?.name}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>월 요금</span><span className={styles.completeInfoValue}>{selectedPlan ? formatPrice(selectedPlan.monthly) : ""}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>이름</span><span className={styles.completeInfoValue}>{formData.name}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>생년월일</span><span className={styles.completeInfoValue}>{formData.birth}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>연락처</span><span className={styles.completeInfoValue}>{formData.phone}</span></div>
                  <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>신분증</span><span className={styles.completeInfoValue}>{formData.idType}</span></div>
                  {formData.address && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>주소</span><span className={styles.completeInfoValue}>{formData.address}</span></div>}
                  {formData.device && <div className={styles.completeInfoRow}><span className={styles.completeInfoLabel}>단말기</span><span className={styles.completeInfoValue}>{formData.device}</span></div>}
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
