<p align="center">
  <img width="240" height="624" alt="logo" src="https://github.com/user-attachments/assets/830183fd-94ee-4940-86ea-49e45cfbe260" />

</p>
<h1 align="center">GUARDIAN</h1>
<p align="center">복약 플랜 · 의료 매칭 · 웹푸시 알림 플랫폼</p>

---

## 🛡️ 프로젝트 개요
- 복약 누락/중복 복용을 줄이고, 보호자·케어매니저·관리자가 협업할 수 있는 통합 헬스케어 관리 서비스
- 복약 일정/복용 로그, 채팅, 매칭, 웹푸시 알림을 하나의 워크플로우로 묶어 제공

## ✨ 주요 기능

### 1. 💊 빈틈없는 복약 관리 시스템
- **스마트 리마인더**: 설정된 복약 시간에 맞춰 알림을 발송하여 누락 방지
- **직관적인 타임라인**: 오늘 먹어야 할 약과 복용 여부를 한눈에 확인 가능
- **복용 로그 기록**: 약 복용 시점을 기록하여 중복 복용 사고 예방

### 2. 🤝 실시간 케어 & 커뮤니케이션
- **역할별 워크스페이스**: 환자(Client), 보호자(Provider), 매니저(Manager) 각 역할에 최적화된 화면 제공
- **실시간 채팅**: 환자의 상태 변화나 특이사항을 즉시 공유
- **웹푸시 알림**: 앱 설치 없이도 중요한 알림을 놓치지 않도록 브라우저 알림 지원 (iOS/Android)

### 3. 📊 관리자/전문가 전용 대시보드
- **환자 현황 모니터링**: 담당 환자들의 복약 준수율과 건강 상태를 한눈에 파악
- **매칭 시스템**: 환자와 적절한 케어 매니저를 연결하여 전문적인 관리 지원

## 🧰 기술 스택
- Backend: Java 17, Spring Boot, Spring Security, JPA(Hibernate)
- Frontend: Next.js 14 (React)
- DB: MariaDB
- Infra: AWS EC2, Nginx, Docker, GitHub Actions(CI/CD), Web Push

## 🏗️ 아키텍처
```
Client (Next.js)
   ↓
Nginx
   ↓
Spring Boot API (guardian.jar)
   ↓
MariaDB
```

## ⚙️ 로컬 개발 가이드
### Backend
```bash
./gradlew clean bootJar -x test
java -jar build/libs/guardian-0.0.1-SNAPSHOT.jar \
  --spring.config.additional-location=file:./application-secret.yml
```

필수 설정 (환경변수 또는 application-secret.yml):
- `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`, `WEB_PUSH_TIMEZONE`
- DB 접속 정보, JWT 시크릿

### Frontend (frontapp)
```bash
cd frontapp
npm ci
npm run dev   # 개발
npm run build # 배포 빌드
```

## 🚀 배포 파이프라인 (GitHub Actions)
- `.github/workflows/deploy2.yml`
- Backend/Frontend 잡을 병렬 실행 → 배포 시간 단축
- Backend: Gradle 빌드 → JAR SCP → EC2에서 서비스 재시작
- Frontend: Next.js 빌드 → 산출물 SCP → EC2에서 npm ci + build + 서비스 재시작

## 🔔 웹푸시 설정
- 서비스 워커: `frontapp/public/sw.js` (아이콘 `/image/logo.png`)
- 백엔드 WebPush: `webpush.vapid.*` 설정이 비어 있으면 `/api/push/config`에서 비활성 처리됨
- iOS Safari는 홈 화면에 추가된 PWA에서만 푸시 지원, HTTPS 접속 필수

## 🛠️ 주요 트러블슈팅
### 1. 로컬/배포 환경의 쿠키 정책 불일치 (Cookie & Session)
- **Problem**: 로컬 개발(HTTP)에서는 로그인이 잘 되는데, 배포 환경(HTTPS)에서는 세션이 풀리는 현상 발생.
- **Cause**: 보안 강화(Chrome 80+)로 `SameSite=None` 설정 시 `Secure` 속성이 필수지만, 로컬 HTTP 환경에서는 `Secure` 쿠키가 저장되지 않음.
- **Solution**: 환경별 프로파일(Local/Prod)을 분리하여 로컬에서는 `Secure` 해제, 배포 시에는 HTTPS 및 `Secure` 적용으로 **보안과 개발 편의성 동시 확보**.

### 2. 글로벌 타임존 동기화 문제 (Timezone)
- **Problem**: 복약 알림이 설정한 시간보다 9시간 늦게 오거나, 날짜가 하루 밀리는 현상.
- **Cause**: AWS RDS(UTC), EC2(UTC), Spring Boot(System Default) 간의 타임존 설정이 달라, 날짜 계산 시점 불일치.
- **Solution**: DB, 서버(JVM), 스케줄러의 타임존을 모두 **Asia/Seoul(KST)**로 통일하여 알림 발송 시간의 정합성 해결.

### 3. CI/CD 환경 변수 주입 시점 이슈
- **Problem**: GitHub Actions 배포 직후, API 요청이 자꾸 `localhost`로 전송됨.
- **Cause**: Next.js는 **빌드 타임(Build Time)**에 환경변수(`NEXT_PUBLIC_*`)를 굽는데(Embed), CI/CD 파이프라인 상에서 빌드 시점의 변수 주입이 누락됨.
- **Solution**: 배포 스크립트 수정하여 빌드 직전에 `.env.production` 파일을 생성 및 주입하도록 파이프라인 개선.

## 📑 기술적 의사결정 (Key Engineering Decisions)

### 1. 웹 푸시(Web Push) 도입
- **Context**: 별도의 앱 설치 없이 환자들에게 복약 알림을 발송해야 하는 요구사항 존재.
- **Decision**: 브라우저 표준 기술인 **Web Push**를 도입하고, iOS Safari까지 지원하도록 구현함.
- **Impact**: 환자가 고가의 기기나 추가 앱 설치 없이도, 기존 기기 그대로 알림을 받을 수 있어 **접근성 극대화**.

### 2. Next.js 기반의 SPA(Single Page Application)
- **Context**: 채팅과 알림이 실시간으로 오가는 환경에서 페이지 깜빡임은 사용자 경험 저하 유발.
- **Decision**: Next.js를 사용하여 페이지 이동 없이 부드럽게 화면이 전환되도록 구현.
- **Impact**: **앱과 유사한 사용자 경험**을 제공하며, 필요한 데이터만 불러오기 때문에 모바일 데이터 절약 효과 확보.

### 3. 역할 기반 권한 분리 (RBAC)
- **Context**: 환자의 민감한 의료 정보는 보호자와 담당 매니저만 열람 가능해야 함.
- **Decision**: 사용자 역할을 4단계(환자/보호자/매니저/관리자)로 나누어 철저히 접근 통제.
- **Impact**: **데이터 보안**을 강화하면서도, 각 역할에 맞는 화면만 노출하여 **사용 편의성** 증대.

### 4. 보안 중심의 로그인 설계 (JWT/HTTPS)
- **Context**: 의료 정보를 다루는 만큼 보안 최우선 고려 필요.
- **Decision**: 모든 통신을 암호화(HTTPS)하고, 세션 탈취 방지를 위한 강화된 쿠키 정책 적용.
- **Impact**: 공용 와이파이 등 보안이 취약한 환경에서도 안전하게 서비스 이용 가능.

### 5. 병렬 배포 시스템 (CI/CD Optimization)
- **Context**: 잦은 수정과 배포로 인해 서비스 중단 시간이 길어지는 문제 발생.
- **Decision**: GitHub Actions를 통해 프론트엔드와 백엔드를 동시에 빌드하고 배포하는 파이프라인 구축.
- **Impact**: 배포 시간을 절반으로 단축하여, 사용자 피드백을 빠르게 반영할 수 있는 **민첩한 개발 환경** 조성.

## 👤 담당 역할

<table border="1" style="border-collapse: collapse; text-align: center;">
  <thead>
    <tr>
      <th width="200">서수한 (팀장)(ㅌth>
      <th width="200">황정성</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td></td>
      <td style="text-align: center;">
        <img src="https://github.com/user-attachments/assets/83c2a379-5c7e-4bf5-9d8c-ac5c9d5a9e3e" style="display: block; margin: 0 auto;" width="150" height="190" /></td>
    </tr>
    <tr style="text-align: center;">
      <td style="text-align: center;">깃 주소</td>
      <td style="text-align: center;"><a href="https://github.com/HwangJeongSeong" target="_blank">@HwangJeongSeong</a></td>
    </tr>
  </tbody>
</table>
- 황정성: 백엔드 전반(아키텍처, DB 모델링, 인증/JWT, 매칭/복약/알림/WebPush) 설계·구현 + 프론트엔드 전반(SPA 구조, 페이지/UX/로직) 개발!

## 📍 서비스 주소
- https://prjguardian.com/

## 🎥 프로젝트 시연 영상

https://youtu.be/xxxxxx (아직없음)

---

## 🧭 향후 개선 사항
