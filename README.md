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
- 회원가입/로그인, 역할 기반 권한 분리 (CLIENT/PROVIDER/MANAGER/ADMIN)
- 복약 일정 등록·리마인더, 복용 확인 로그
- 채팅 + 알림(웹푸시)으로 실시간 커뮤니케이션
- 매칭/케어 관리, 관리자 대시보드

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
- 외부 설정 로딩: `spring.config.import` / `spring.config.additional-location`로 분리
- JWT 필터 충돌: Security Filter Chain 재설계
- VAPID 키 미설정: 환경변수 주입 후 `/api/push/config`로 활성 여부 확인

## 📑 기술적 의사결정
- **웹푸시(Web Push)**: 모바일 브라우저 푸시를 위해 VAPID 기반 구현, iOS PWA 제약 대응 → 백엔드 `/api/push/config`로 활성 여부 노출, 프론트는 조건부 구독
- **SPA 기반 Next.js**: 채팅/푸시 등 실시간 UX를 위해 클라이언트 라우팅 유지, 서버는 API 전담
- **역할 기반 권한(RBAC)**: CLIENT/PROVIDER/MANAGER/ADMIN 분리로 데이터 접근·행동 제어, SecurityConfig로 최소 개방
- **외부 설정 분리**: `spring.config.import` + 환경변수 우선으로 시크릿/키 관리 (`application-secret.yml`은 옵션)
- **CI/CD 병렬화**: GitHub Actions에서 백엔드/프론트 잡을 병렬 실행해 배포 시간 단축

## 👤 담당 역할

<table border="1" style="border-collapse: collapse; text-align: center;">
  <thead>
    <tr>
      <th width="200">서수한</th>
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
