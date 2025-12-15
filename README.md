<p align="center">
  <img width="240" height="624" alt="logo" src="https://github.com/user-attachments/assets/830183fd-94ee-4940-86ea-49e45cfbe260" />

</p>

<h1 align="center">GUARDIAN</h1>

<p align="center">
  복약 플랜 관리 플렛폼
</p>

---

## 🛡️ 프로젝트 개요

**Guardian**은 복약 관리와 의료 서비스 이용 과정에서 발생하는  
복약 누락, 정보 단절, 관리 부재 문제를 해결하기 위해 기획된  
**통합 헬스케어 관리 플랫폼**입니다.

사용자는 복약 알림과 상태 관리를 통해 보다 안전하게 건강을 관리할 수 있으며,  
의료 제공자는 역할 기반 시스템을 통해 효율적인 서비스 운영이 가능합니다.

---

## 🎯 기획 배경 & 목적

### 기획 배경
- 복약 시간 누락 및 중복 복용으로 인한 건강 리스크
- 사용자–의료 제공자 간 비효율적인 관리 구조
- 단순 알림 앱을 넘어선 **신뢰 가능한 의료 관리 시스템**의 필요성

### 프로젝트 목적
- 복약 일정 자동화 및 알림 시스템 제공
- 역할 기반 사용자 분리를 통한 안정적인 서비스 운영
- 실서비스 확장을 고려한 백엔드 중심 아키텍처 설계

---

## ✨ 주요 기능

- 회원 가입 / 로그인 (JWT 기반 인증)
- 역할 기반 사용자 관리 (CLIENT / PROVIDER / ADMIN)
- 복약 일정 등록 및 관리
- Web Push 기반 복약 알림
- 의료 서비스 매칭 관리
- 관리자 기능 (사용자 및 상태 관리)

---

## 🧰 기술 스택

### Backend
- Java 17
- Spring Boot
- Spring Security
- JPA (Hibernate)

### Database
- MariaDB

### Infra / DevOps
- AWS EC2
- Docker
- GitHub Actions (CI/CD)
- Nginx

### Frontend
- Web (React / Next.js)

---

## 🏗️ 시스템 아키텍처

    
Client (Web)  
↓  
Nginx  
↓  
Spring Boot API Server  
↓  
MariaDB  


---

## ⚙️ 개발 환경 및 세팅

- Java 21
- Gradle 8.x
- IntelliJ IDEA
- Docker / Docker Compose

```bash
java -jar guardian.jar \
  --spring.config.additional-location=file:/app/config/
```

---

## 📦 Dependencies

Spring Web

Spring Security

Spring Data JPA

JWT

WebPush

---

## 🗄️ DB 설계

User

Role

Medication

Alarm

Matching

역할 기반 권한 분리와 의료 도메인 확장성을 고려하여 설계

---

## 📡 API 명세 (요약)
Method	Endpoint	Description
POST	/auth/login	로그인
POST	/medication	복약 등록
GET	/alarm	복약 알림 조회

---

## 👤 담당 역할

황정성

백엔드 아키텍처 설계

UI/UX 디자인

프론트엔드 아키텍쳐 설계

백엔드

프론트 엔드

DB 모델링

WebPush

환자 매칭

복약관리 시스템

로그인/회원가입

Client 페이지

Manager 페이지

개인정보수정 페이지

---

## 🛠️ Trouble Shooting

Docker 환경에서 설정 파일 로딩 문제
→ spring.config.additional-location 옵션을 통해 외부 설정 분리

JWT 인증 필터 충돌 문제
→ Security Filter Chain 구조 재설계로 해결

Web Push VAPID 키 관리 이슈
→ 서버 환경 변수 기반 관리로 보안 강화

---

## 🔐 보안 및 안정성 고려

JWT + HTTPS 기반 인증

역할 기반 접근 제어 (RBAC)

민감 정보 설정 파일 분리 관리

서버 환경별 설정 분리

---

## 🚀 배포 주소

https://prjguardian.com/

---

## 🎥 프로젝트 시연 영상

https://youtu.be/xxxxxx (아직없음)

---

## 🧭 향후 개선 사항

