<p align="center">
  <img width="240" height="624" alt="logo" src="https://github.com/user-attachments/assets/830183fd-94ee-4940-86ea-49e45cfbe260" />

</p>
<h1 align="center">GUARDIAN</h1>
<p align="center">
  <b>환자와 보호자를 잇는 스마트 복약 관리 솔루션</b><br>
  복약 플랜 · 의료 매칭 · 웹푸시 알림
</p>

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
- **매칭 시스템**: 환자와 보호자를 연결하여 적절한 관리 지원

## 🛠️ 기술 스택 (Tech Stack)

### Backend
<img src="https://img.shields.io/badge/Java 17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white"> <img src="https://img.shields.io/badge/Spring Boot 3.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"> <img src="https://img.shields.io/badge/Spring Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white"> <img src="https://img.shields.io/badge/JPA (Hibernate)-59666C?style=for-the-badge&logo=hibernate&logoColor=white">

### Frontend
<img src="https://img.shields.io/badge/Next.js 14-000000?style=for-the-badge&logo=next.js&logoColor=white"> <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/PWA (Web Push)-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white">

### Database
<img src="https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white">

### Infra & Tools
<img src="https://img.shields.io/badge/AWS EC2-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white"> <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white"> <img src="https://img.shields.io/badge/GitHub Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white">

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
<details>
  <summary> 황정성 </summary> 
  
  ### 1. 로컬/배포 환경의 쿠키 정책 불일치 (Cookie & Session)
- **Problem**: 로컬 개발(HTTP)에서는 로그인이 잘 되는데, 배포 환경(HTTPS)에서는 세션이 풀리는 현상 발생.
- **Cause**: 보안 강화(Chrome 80+)로 `SameSite=None` 설정 시 `Secure` 속성이 필수지만, 로컬 HTTP 환경에서는 `Secure` 쿠키가 저장되지 않음.
- **Solution**: 환경별 프로파일(Dev/Prod)을 분리하여 로컬에서는 `Secure` 해제, 배포 시에는 HTTPS 및 `Secure` 적용으로 **보안과 개발 편의성 동시 확보**.

### 2. 글로벌 타임존 동기화 문제 (Timezone)
- **Problem**: 복약 알림이 설정한 시간보다 9시간 늦게 오거나, 날짜가 하루 밀리는 현상.
- **Cause**: AWS RDS(UTC), EC2(UTC), Spring Boot(System Default) 간의 타임존 설정이 달라, 날짜 계산 시점 불일치.
- **Solution**: DB, 서버(JVM), 스케줄러의 타임존을 모두 **Asia/Seoul(KST)**로 통일하여 알림 발송 시간의 정합성 해결.

### 3. CI/CD 환경 변수 주입 시점 이슈
- **Problem**: GitHub Actions 배포 직후, API 요청이 자꾸 `localhost`로 전송됨.
- **Cause**: Next.js는 **빌드 타임(Build Time)**에 환경변수(`NEXT_PUBLIC_*`)를 굽는데(Embed), CI/CD 파이프라인 상에서 빌드 시점의 변수 주입이 누락됨.
- **Solution**: 배포 스크립트 수정하여 빌드 직전에 `.env.production` 파일을 생성 및 주입하도록 파이프라인 개선.

### 4. WebSocket 연결 실패 (400/403 Error)
- **Problem**: 로컬에선 잘 되던 실시간 채팅이 배포 환경(Nginx)을 거치자 연결이 끊김.
- **Cause**: WebSocket은 HTTP 핸드셰이크 과정에서 `Upgrade` 헤더가 필요한데, Nginx 프록시 기본 설정이 이를 전달하지 않음.
- **Solution**: Nginx 설정에 `proxy_set_header Upgrade $http_upgrade` 및 `Connection "upgrade"`를 명시하여 핸드셰이크 패킷이 정상 전달되도록 수정.

### 5. JWT 필터와 Spring Security 충돌
- **Problem**: 인증 토큰이 있는데도 `AuthenticationCredentialsNotFoundException`이 발생하며 401 에러 리턴.
- **Cause**: 커스텀 JWT 필터가 Security Filter Chain의 적절한 위치(UsernamePasswordFilter 앞)에 배치되지 않아, 인증 객체(Authentication)가 생성되기 전에 보안 검사가 실행됨.
- **Solution**: `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`로 필터 순서를 명확히 재정의하여 해결.

### 6. 서비스 워커 캐싱으로 구버전 화면 노출
- **Problem**: 배포 후에도 이전 JS/CSS가 계속 로드되어 신규 기능이 보이지 않음.
- **Cause**: PWA 서비스 워커가 `stale-while-revalidate` 캐시를 유지하며, 새 워커 활성화(`activate`)가 지연됨.
- **Solution**: `skipWaiting()`·`clients.claim()` 호출로 새 워커 즉시 활성화, 캐시 버전 키에 빌드 해시를 포함해 롤백/재배포 시 캐시 충돌 방지.

### 7. 환자/복용 로그 조회 시 N+1 쿼리 폭증
- **Problem**: 환자 리스트 화면 로딩이 느려지고 DB 커넥션 사용량 급증.
- **Cause**: JPA 연관관계(LAZY) 컬렉션을 조회하며 각 환자별로 추가 SELECT가 발생.
- **Solution**: 핵심 조회에 `fetch join`·`@EntityGraph` 적용, 대량 목록에는 `hibernate.default_batch_fetch_size`로 배치 로딩을 설정해 쿼리 수를 상수에 가깝게 감소.
</details>


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
      <th width="200">서수한 (팀장)</th>
      <th width="200">황정성</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="https://github.com/user-attachments/assets/9c46d2dc-9353-485a-a7ba-30f04adea97b" style="display: block; margin: 0 auto;" width="165" height="190" /></td>
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

- 서수한:

## 📍 서비스 주소
- https://prjguardian.com/

## 🎥 프로젝트 시연 영상

https://youtu.be/xxxxxx (아직없음)

---

## 🧭 향후 개선 사항
