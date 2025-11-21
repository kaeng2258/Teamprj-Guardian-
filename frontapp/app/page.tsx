"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type AuthMode = "login" | "register";
type UserRoleOption = "CLIENT" | "MANAGER";
type RegisterRoleValue = "" | UserRoleOption;

type ApiErrorPayload = {
  message?: string;
};

type LoginSuccessPayload = {
  userId: number;
  role: string;
  accessToken: string;
  refreshToken: string;
  redirectPath: string;
};

type RegisterSuccessPayload = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName?: string;
  apartment?: "Y" | "N";
};

const roleLabels: Record<UserRoleOption, string> = {
  CLIENT: "환자",
  MANAGER: "매니저",
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (config: { oncomplete: (data: DaumPostcodeData) => void }) => {
        open: () => void;
      };
    };
  }
}

async function extractErrorMessage(response: Response) {
  try {
    const data: ApiErrorPayload = await response.json();
    if (data?.message) {
      return data.message;
    }
  } catch (error) {
    // ignore JSON parse errors
  }

  if (response.status >= 500) {
    return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  return "요청을 처리할 수 없습니다. 입력 값을 다시 확인해주세요.";
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerRole, setRegisterRole] = useState<RegisterRoleValue>("");
  const [registerName, setRegisterName] = useState("");
  const [registerBirthDate, setRegisterBirthDate] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerTermsAgreed, setRegisterTermsAgreed] = useState(false);
  const [registerPrivacyAgreed, setRegisterPrivacyAgreed] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [emailCheckStatus, setEmailCheckStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");
  const [registerZipCode, setRegisterZipCode] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerDetailAddress, setRegisterDetailAddress] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const tabClassName = useMemo(
    () => ({
      base:
        "relative z-10 flex-1 rounded-2xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-50/70 hover:shadow-lg hover:shadow-slate-900/20 active:shadow-inner",
      active: "text-slate-900",
      inactive: "text-slate-100/80 hover:text-white",
    }),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existing = document.getElementById("daum-postcode-script");
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginMessage("");
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        setLoginError(errorMessage);
        return;
      }

      const payload: LoginSuccessPayload = await response.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", payload.accessToken);
        window.localStorage.setItem("refreshToken", payload.refreshToken);
        window.localStorage.setItem("userRole", payload.role);
        window.localStorage.setItem("userId", String(payload.userId));
        window.localStorage.setItem("userEmail", loginEmail);
      }

      if (payload.redirectPath) {
        router.push(payload.redirectPath);
        return;
      }

      setLoginMessage("로그인에 성공했습니다.");
    } catch (error) {
      setLoginError("서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterMessage("");
    setRegisterError("");

    if (!registerRole) {
      setRegisterError("회원 유형을 선택해주세요.");
      return;
    }

    if (!registerBirthDate) {
      setRegisterError("생년월일을 입력해주세요.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (emailCheckStatus !== "available" || checkedEmail !== registerEmail) {
      setRegisterError("이메일 중복 확인을 완료해주세요.");
      return;
    }

    if (!registerZipCode || !registerAddress) {
      setRegisterError("주소를 검색하여 선택해주세요.");
      return;
    }

    if (!registerTermsAgreed || !registerPrivacyAgreed) {
      setRegisterError("이용약관과 개인정보 처리방침에 모두 동의해야 합니다.");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: registerRole,
          email: registerEmail,
          password: registerPassword,
          name: registerName,
          birthDate: registerBirthDate,
          zipCode: registerZipCode,
          address: registerAddress,
          detailAddress: registerDetailAddress,
          termsAgreed: registerTermsAgreed,
          privacyAgreed: registerPrivacyAgreed,
        }),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        setRegisterError(errorMessage);
        return;
      }

      const payload: RegisterSuccessPayload = await response.json();
      setRegisterMessage(`${payload.name}님, 가입이 완료되었습니다. 로그인 해주세요.`);
      setLoginEmail(payload.email);
      setActiveTab("login");
      setRegisterZipCode("");
      setRegisterAddress("");
      setRegisterDetailAddress("");
      setRegisterRole("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterBirthDate("");
      setEmailCheckStatus("idle");
      setEmailCheckMessage("");
      setCheckedEmail("");
    } catch (error) {
      setRegisterError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleAddressSearch = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.daum || !window.daum.Postcode) {
      alert("주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        setRegisterZipCode(data.zonecode ?? "");
        const fullAddress = data.roadAddress || data.jibunAddress || "";
        setRegisterAddress(fullAddress);

        const suggestedDetail =
          data.apartment === "Y" && data.buildingName ? data.buildingName : "";
        setRegisterDetailAddress(suggestedDetail);
      },
    }).open();
  };

  const handleEmailCheck = async () => {
    if (!registerEmail) {
      setEmailCheckStatus("unavailable");
      setEmailCheckMessage("이메일을 입력한 뒤 다시 시도해주세요.");
      return;
    }

    setEmailCheckStatus("checking");
    setEmailCheckMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/check-email?email=${encodeURIComponent(registerEmail)}`
      );

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        setEmailCheckStatus("unavailable");
        setEmailCheckMessage(errorMessage);
        return;
      }

      const data: { available: boolean; message: string } = await response.json();
      setCheckedEmail(registerEmail);
      setEmailCheckStatus(data.available ? "available" : "unavailable");
      setEmailCheckMessage(data.message);
    } catch (error) {
      setEmailCheckStatus("unavailable");
      setEmailCheckMessage("이메일 중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <main className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          Guardian 서비스
        </h1>
        <div className="relative mb-8 flex overflow-hidden rounded-2xl bg-slate-900/90 p-1 text-sm shadow-lg shadow-slate-900/40">
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-2xl bg-slate-50/95 shadow-lg shadow-slate-900/30 transition-transform duration-500 ease-out will-change-transform ${
              activeTab === "login" ? "translate-x-0" : "translate-x-full"
            }`}
          />
          <button
            className={`${tabClassName.base} ${
              activeTab === "login" ? tabClassName.active : tabClassName.inactive
            }`}
            onClick={() => {
              setActiveTab("login");
              setLoginError("");
              setRegisterMessage("");
            }}
            type="button"
          >
            로그인
          </button>
          <button
            className={`${tabClassName.base} ${
              activeTab === "register"
                ? tabClassName.active
                : tabClassName.inactive
            }`}
            onClick={() => {
              setActiveTab("register");
              setRegisterError("");
              setLoginMessage("");
            }}
            type="button"
          >
            회원가입
          </button>
        </div>

        <div className="relative overflow-hidden">
          <div
            key={activeTab}
            className={`rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-inner shadow-slate-200 backdrop-blur ${
              activeTab === "login"
                ? "animate-panel-from-left"
                : "animate-panel-from-right"
            }`}
          >
            {activeTab === "login" ? (
              <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">이메일</span>
                <input
                  aria-label="이메일"
                  autoComplete="email"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={loginEmail}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">비밀번호</span>
                <input
                  aria-label="비밀번호"
                  autoComplete="current-password"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  type="password"
                  value={loginPassword}
                />
              </label>
              <button
                className="rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
                disabled={loginLoading}
                type="submit"
              >
                {loginLoading ? "로그인 중..." : "로그인"}
              </button>
              {loginMessage && (
                <pre className="whitespace-pre-wrap rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  {loginMessage}
                </pre>
              )}
              {loginError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {loginError}
                </p>
              )}
              </form>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={handleRegisterSubmit}
              >
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">이름</span>
                <input
                  aria-label="이름"
                  autoComplete="name"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="홍길동"
                  required
                  type="text"
                  value={registerName}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">생년월일</span>
                <input
                  aria-label="생년월일"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) => setRegisterBirthDate(event.target.value)}
                  placeholder="YYYY-MM-DD"
                  required
                  type="date"
                  value={registerBirthDate}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">이메일</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="회원가입 이메일"
                    autoComplete="email"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                    onChange={(event) => {
                      const value = event.target.value;
                      setRegisterEmail(value);
                      if (value !== checkedEmail) {
                        setEmailCheckStatus("idle");
                        setEmailCheckMessage("");
                      }
                    }}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={registerEmail}
                  />
                  <button
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={emailCheckStatus === "checking" || !registerEmail}
                    onClick={handleEmailCheck}
                    type="button"
                  >
                    {emailCheckStatus === "checking" ? "확인 중..." : "중복 확인"}
                  </button>
                </div>
                {emailCheckMessage && (
                  <p
                    className={`text-sm ${
                      emailCheckStatus === "available" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {emailCheckMessage}
                  </p>
                )}
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600">비밀번호</span>
                  <input
                    aria-label="회원가입 비밀번호"
                    autoComplete="new-password"
                    className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="영문, 숫자 포함 8자 이상"
                    required
                    type="password"
                    value={registerPassword}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600">비밀번호 확인</span>
                  <input
                    aria-label="비밀번호 확인"
                    autoComplete="new-password"
                    className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                    onChange={(event) =>
                      setRegisterConfirmPassword(event.target.value)
                    }
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    type="password"
                    value={registerConfirmPassword}
                  />
                </label>
              </div>
  
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">가입 유형</span>
                <select
                  aria-label="가입 유형"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) =>
                    setRegisterRole(event.target.value as RegisterRoleValue)
                  }
                  value={registerRole}
                >
                  <option disabled value="">
                    회원 유형을 선택하세요
                  </option>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
  
              <div className="flex flex-col gap-2">
                <span className="text-sm text-gray-600">주소</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="우편번호"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none sm:max-w-[180px]"
                    placeholder="우편번호"
                    readOnly
                    required
                    value={registerZipCode}
                  />
                  <button
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:border-black"
                    onClick={handleAddressSearch}
                    type="button"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  aria-label="기본 주소"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  placeholder="기본 주소"
                  readOnly
                  required
                  value={registerAddress}
                />
                <input
                  aria-label="상세 주소"
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                  onChange={(event) => setRegisterDetailAddress(event.target.value)}
                  placeholder="상세 주소를 입력하세요"
                  value={registerDetailAddress}
                />
              </div>
  
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  checked={registerTermsAgreed}
                  className="mt-1"
                  onChange={(event) => setRegisterTermsAgreed(event.target.checked)}
                  type="checkbox"
                />
                <span>이용약관(필수)을 확인하고 동의합니다.</span>
              </label>
  
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  checked={registerPrivacyAgreed}
                  className="mt-1"
                  onChange={(event) =>
                    setRegisterPrivacyAgreed(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>개인정보 처리방침(필수)에 동의합니다.</span>
              </label>
  
              <button
                className="rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
                disabled={registerLoading}
                type="submit"
              >
                {registerLoading ? "가입 중..." : "회원가입"}
              </button>
  
              {registerMessage && (
                <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  {registerMessage}
                </p>
              )}
              {registerError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {registerError}
                </p>
              )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
