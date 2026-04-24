# CLAUDE.md

> **[글로벌 인프라 참조 가이드](C:\Users\bluee\.claude\INFRASTRUCTURE_GLOBAL_REFERENCE.md)** — 모든 세션 필수 참조

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

- **프로젝트명**: TeleQuote (통신사 견적서)
- **발주자**: 택군 (숨고 수주)
- **목적**: 통신사별 견적서 즉시 출력 + 알뜰폰 견적 사이트
- **벤치마킹**: 바로폼(baroform.com) — 통신 판매점용 개통 신청서 자동 작성/출력 서비스
- **핵심 기능**: 견적서 작성/출력, 통신사별 요금제 비교, 문자 발송 기능

## 작업 규칙

작업이 완료되면 반드시 변경사항을 커밋하고 원격 저장소에 푸시한다.
커밋 메시지는 항상 한글로 작성한다.

## 기술 스택

- **FE**: Next.js (App Router) + TypeScript + CSS Modules
- **배포**: Cloudflare Pages (예정)
- **브랜치**: main

## 배포

- **플랫폼**: Cloudflare Pages (예정)
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `.next`
