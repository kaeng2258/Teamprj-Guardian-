"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import PhoneNumberInput from "../components/PhoneNumberInput";

//test
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
  CLIENT: "일반",
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
  const [transitionKey, setTransitionKey] = useState(0);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerRole, setRegisterRole] = useState<RegisterRoleValue>("");
  const [registerName, setRegisterName] = useState("");
  const [registerBirthDate, setRegisterBirthDate] = useState("");
  const [registerGender, setRegisterGender] = useState("");
  const [registerPhone1, setRegisterPhone1] = useState("");
  const [registerPhone2, setRegisterPhone2] = useState("");
  const [registerPhone3, setRegisterPhone3] = useState("");
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
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmStatus, setConfirmStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [confirmMessage, setConfirmMessage] = useState("");
  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none placeholder:text-slate-400";
  const labelClassName = "flex flex-col gap-2 text-sm font-medium text-slate-800";
  const statusClassName = {
    success:
      "rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800",
    error: "rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700",
  };
  const tabSwitchClass = {
    base:
      "relative z-10 flex-1 rounded-2xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-50/70 hover:shadow-lg hover:shadow-slate-900/20 active:shadow-inner",
    active: "text-slate-900",
    inactive: "text-slate-100/80 hover:text-white",
  };
  const handleTabSwitch = (mode: AuthMode) => {
    if (mode === activeTab) return;
    if (mode === "login") {
      setLoginError("");
      setRegisterMessage("");
    } else {
      setRegisterError("");
      setLoginMessage("");
    }
    setActiveTab(mode);
    setTransitionKey((value) => value + 1);
  };

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
        const authPayload = {
          userId: payload.userId,
          role: payload.role,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          email: loginEmail,
        };

        window.localStorage.setItem("guardian_auth", JSON.stringify(authPayload));
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

  const validatePassword = (value: string) => {
    if (!value) {
      return { valid: false, message: "비밀번호를 입력해주세요." };
    }
    if (value.length < 8) {
      return { valid: false, message: "비밀번호는 8자 이상이어야 합니다." };
    }
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      return { valid: false, message: "영문과 숫자를 모두 포함해야 합니다." };
    }
    return { valid: true, message: "안전한 비밀번호입니다." };
  };

  const validateConfirmPassword = (confirm: string, password: string) => {
    if (!confirm) {
      return { valid: false, message: "비밀번호 확인을 입력해주세요." };
    }
    if (confirm !== password) {
      return { valid: false, message: "비밀번호 확인이 일치하지 않습니다." };
    }
    return { valid: true, message: "비밀번호가 일치합니다." };
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterMessage("");
    setRegisterError("");
    const registerPhone = [registerPhone1, registerPhone2, registerPhone3].join("-");

    if (!registerRole) {
      setRegisterError("회원 유형을 선택해주세요.");
      return;
    }

    if (!registerBirthDate) {
      setRegisterError("생년월일을 입력해주세요.");
      return;
    }

    if (!registerGender) {
      setRegisterError("성별을 선택해주세요.");
      return;
    }

    if (
      !registerPhone1 ||
      !registerPhone2 ||
      !registerPhone3 ||
      registerPhone2.length < 4 ||
      registerPhone3.length < 4
    ) {
      setRegisterError("휴대전화 번호를 모두 입력해주세요.");
      return;
    }

    const passwordCheck = validatePassword(registerPassword);
    if (!passwordCheck.valid) {
      setPasswordStatus("invalid");
      setPasswordMessage(passwordCheck.message);
      setRegisterError(passwordCheck.message);
      return;
    }

    const confirmCheck = validateConfirmPassword(registerConfirmPassword, registerPassword);
    if (!confirmCheck.valid) {
      setConfirmStatus("invalid");
      setConfirmMessage(confirmCheck.message);
      setRegisterError(confirmCheck.message);
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
          phone: registerPhone,
          birthDate: registerBirthDate,
          gender: registerGender,
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
      setRegisterGender("");
      setEmailCheckStatus("idle");
      setEmailCheckMessage("");
      setCheckedEmail("");
      setPasswordStatus("idle");
      setPasswordMessage("");
      setConfirmStatus("idle");
      setConfirmMessage("");
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-12 top-10 h-48 w-48 rounded-full bg-indigo-100 blur-3xl" />
        <div className="absolute bottom-12 right-16 h-56 w-56 rounded-full bg-sky-100 blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-100 bg-white/90 shadow-2xl backdrop-blur">
        <div className="relative md:h-[620px] md:max-h-[80vh]">
          <section
            className={`hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-800 px-10 py-12 text-slate-100 transition-all duration-600 ease-in-out md:absolute md:inset-y-0 md:flex md:h-full md:w-[42%] ${
              activeTab === "login"
                ? "md:left-0 md:animate-panel-swap-in-left motion-reduce:animate-none"
                : "md:left-[58%] md:animate-panel-swap-out-left motion-reduce:animate-none"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_78%_28%,rgba(79,70,229,0.18),transparent_32%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  alt="Guardian 로고"
                  height={42}
                  src="/image/logo.png"
                  width={42}
                  priority
                />
                <p className="text-4xl font-semibold uppercase tracking-[0.24em] text-indigo-100 leading-none">
                  Guardian
                </p>
              </div>
              <h1 className="text-3xl font-semibold leading-tight">
                간병 관리와 간병인을 위한
                <br />
                안정적인 시작
              </h1>
              <p className="text-sm text-slate-200/90">
                한 계정으로 일정을 확인하고 필요한 서비스를 바로 이용하세요.
              </p>
            </div>
              <div className="relative mt-8 grid gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="font-semibold text-white">체계적인 복약 관리</p>
                  <p className="mt-1 text-slate-200/90">
                    일정, 약물, 주기 알림을 한 화면에서 관리할 수 있습니다.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="font-semibold text-white">손쉬운 사용</p>
                  <p className="mt-1 text-slate-200/90">
                    누구든지 금방 서비스를 이용할 수 있습니다.
                  </p>
                </div>
              </div>
          </section>

          <section
            className={`relative p-6 sm:p-8 transition-all duration-600 ease-in-out md:absolute md:inset-y-0 md:flex md:w-[58%] md:flex-col md:h-full md:overflow-y-auto md:pr-6 scroll-thin ${
              activeTab === "login"
                ? "md:left-[42%] md:animate-panel-swap-out-right motion-reduce:animate-none"
                : "md:left-0 md:animate-panel-swap-in-right motion-reduce:animate-none"
            }`}
          >
            <div className="hidden md:hidden" aria-hidden />

            <header className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                  Account
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeTab === "login" ? "로그인" : "회원가입"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "login"
                    ? "등록된 이메일과 비밀번호로 로그인하세요."
                    : "필수 정보를 입력하고 가입을 완료하세요."}
                </p>
              </div>
              <div className="relative mt-2 flex overflow-hidden rounded-2xl bg-slate-900/90 p-1 text-sm shadow-lg shadow-slate-900/40">
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-2xl bg-slate-50/95 shadow-lg shadow-slate-900/30 transition-transform duration-500 ease-out will-change-transform ${
                    activeTab === "login" ? "translate-x-0" : "translate-x-full"
                  }`}
                />
                <button
                  className={`${tabSwitchClass.base} ${
                    activeTab === "login" ? tabSwitchClass.active : tabSwitchClass.inactive
                  }`}
                  onClick={() => {
                    handleTabSwitch("login");
                  }}
                  type="button"
                >
                  로그인
                </button>
                <button
                  className={`${tabSwitchClass.base} ${
                    activeTab === "register" ? tabSwitchClass.active : tabSwitchClass.inactive
                  }`}
                  onClick={() => {
                    handleTabSwitch("register");
                  }}
                  type="button"
                >
                  회원가입
                </button>
              </div>
            </header>

            <div className="mt-8">
              <div
                key={`${activeTab}-${transitionKey}`}
                className={`rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-inner shadow-slate-200 backdrop-blur ${
                  activeTab === "login"
                    ? "md:animate-panel-from-left"
                    : "md:animate-panel-from-right"
                } md:animate-panel-crossfade motion-reduce:animate-none`}
              >
                <div className="md:animate-content-fade-in-out motion-reduce:animate-none">
                  {activeTab === "login" ? (
                    <form className="grid gap-5" onSubmit={handleLoginSubmit}>
                      <label className={labelClassName}>
                        <span>이메일</span>
                        <input
                          aria-label="이메일"
                          autoComplete="email"
                          className={inputClassName}
                          onChange={(event) => setLoginEmail(event.target.value)}
                          placeholder="you@example.com"
                          required
                          type="email"
                          value={loginEmail}
                        />
                      </label>
                      <label className={labelClassName}>
                        <span>비밀번호</span>
                        <input
                          aria-label="비밀번호"
                          autoComplete="current-password"
                          className={inputClassName}
                          onChange={(event) => setLoginPassword(event.target.value)}
                          placeholder="비밀번호를 입력하세요"
                          required
                          type="password"
                          value={loginPassword}
                        />
                      </label>
                      <button
                        className="mt-1 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loginLoading}
                        type="submit"
                      >
                        {loginLoading ? "로그인 중..." : "로그인"}
                      </button>
                      {loginMessage && (
                        <p className={statusClassName.success}>{loginMessage}</p>
                      )}
                      {loginError && <p className={statusClassName.error}>{loginError}</p>}
                    </form>
                  ) : (
                    <form className="space-y-6" onSubmit={handleRegisterSubmit}>
                      <div className="rounded-2xl bg-white/80 p-4 shadow-sm sm:p-5">
                        <div className="space-y-6 divide-y divide-slate-200">
                          <section className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">기본 정보</p>
                              <span className="text-xs text-slate-500">필수 입력</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <label className={labelClassName}>
                                <span>이름</span>
                                <input
                                  aria-label="이름"
                                  autoComplete="name"
                                  className={inputClassName}
                                  onChange={(event) => setRegisterName(event.target.value)}
                                  placeholder="홍길동"
                                  required
                                  type="text"
                                  value={registerName}
                                />
                              </label>
                              <label className={labelClassName}>
                                <span>생년월일</span>
                                <input
                                  aria-label="생년월일"
                                  className={`${inputClassName} ${
                                    registerBirthDate ? "text-slate-900" : "text-slate-400"
                                  }`}
                                  onChange={(event) => setRegisterBirthDate(event.target.value)}
                                  placeholder="YYYY-MM-DD"
                                  required
                                  type="date"
                                  value={registerBirthDate}
                                />
                              </label>
                              <label className={`${labelClassName} md:col-span-2`}>
                                <span>성별</span>
                                <select
                                  aria-label="성별"
                                  className={`${inputClassName} ${
                                    registerGender ? "text-slate-900" : "text-slate-400"
                                  }`}
                                  value={registerGender}
                                  onChange={(event) => setRegisterGender(event.target.value)}
                                  required
                                >
                                  <option value="" className="text-slate-400">
                                    선택해주세요
                                  </option>
                                  <option value="MALE" className="text-slate-900">
                                    남성
                                  </option>
                                  <option value="FEMALE" className="text-slate-900">
                                    여성
                                  </option>
                                </select>
                              </label>
                              <label className={`${labelClassName} md:col-span-2`}>
                                <span>연락처</span>
                                <PhoneNumberInput
                                  ariaLabels={{
                                    first: "전화번호 앞자리",
                                    middle: "전화번호 중간자리",
                                    last: "전화번호 마지막자리",
                                  }}
                                  inputClassName={inputClassName}
                                  maxLengths={{ first: 3, middle: 4, last: 4 }}
                                  onChange={({ first, middle, last }) => {
                                    setRegisterPhone1(first);
                                    setRegisterPhone2(middle);
                                    setRegisterPhone3(last);
                                  }}
                                  parts={{
                                    first: registerPhone1,
                                    middle: registerPhone2,
                                    last: registerPhone3,
                                  }}
                                  placeholders={{ first: "010", middle: "0000", last: "0000" }}
                                  required
                                />
                              </label>
                            </div>
                          </section>

                          <section className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">계정 정보</p>
                              <span className="text-xs text-slate-500">필수 입력</span>
                            </div>
                            <div className="grid gap-4">
                              <label className={labelClassName}>
                                <span>이메일</span>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <input
                                    aria-label="회원가입 이메일"
                                    autoComplete="email"
                                    className={`${inputClassName} sm:flex-1`}
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
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                                      emailCheckStatus === "available"
                                        ? "text-emerald-700"
                                        : "text-rose-700"
                                    }`}
                                  >
                                    {emailCheckMessage}
                                  </p>
                                )}
                              </label>

                              <div className="grid gap-4 md:grid-cols-2">
                                <label className={labelClassName}>
                                  <span>비밀번호</span>
                                  <input
                                    aria-label="회원가입 비밀번호"
                                    autoComplete="new-password"
                                    className={inputClassName}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setRegisterPassword(value);
                                      const result = validatePassword(value);
                                      setPasswordStatus(result.valid ? "valid" : "invalid");
                                      setPasswordMessage(result.message);
                                      if (registerConfirmPassword) {
                                        const confirmResult = validateConfirmPassword(
                                          registerConfirmPassword,
                                          value
                                        );
                                        setConfirmStatus(confirmResult.valid ? "valid" : "invalid");
                                        setConfirmMessage(confirmResult.message);
                                      }
                                    }}
                                    placeholder="영문, 숫자 포함 8자 이상"
                                    required
                                    type="password"
                                    value={registerPassword}
                                  />
                                  {passwordMessage && (
                                    <p
                                      className={`text-sm ${
                                        passwordStatus === "valid"
                                          ? "text-emerald-700"
                                          : "text-rose-700"
                                      }`}
                                    >
                                      {passwordMessage}
                                    </p>
                                  )}
                                </label>
                                <label className={labelClassName}>
                                  <span>비밀번호 확인</span>
                                  <input
                                    aria-label="비밀번호 확인"
                                    autoComplete="new-password"
                                    className={inputClassName}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setRegisterConfirmPassword(value);
                                      const result = validateConfirmPassword(value, registerPassword);
                                      setConfirmStatus(result.valid ? "valid" : "invalid");
                                      setConfirmMessage(result.message);
                                    }}
                                    placeholder="비밀번호를 다시 입력하세요"
                                    required
                                    type="password"
                                    value={registerConfirmPassword}
                                  />
                                  {confirmMessage && (
                                    <p
                                      className={`text-sm ${
                                        confirmStatus === "valid"
                                          ? "text-emerald-700"
                                          : "text-rose-700"
                                      }`}
                                    >
                                      {confirmMessage}
                                    </p>
                                  )}
                                </label>
                              </div>

                              <label className={labelClassName}>
                                <span>가입 유형</span>
                                <select
                                  aria-label="가입 유형"
                                  className={`${inputClassName} ${
                                    registerRole ? "text-slate-900" : "text-slate-400"
                                  }`}
                                  onChange={(event) =>
                                    setRegisterRole(event.target.value as RegisterRoleValue)
                                  }
                                  value={registerRole}
                                >
                                  <option disabled value="" className="text-slate-400">
                                    회원 유형을 선택하세요
                                  </option>
                                  {Object.entries(roleLabels).map(([value, label]) => (
                                    <option key={value} value={value} className="text-slate-900">
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </section>

                          <section className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">주소</p>
                              <span className="text-xs text-slate-500">필수 입력</span>
                            </div>
                            <div className="grid gap-3">
                              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                <input
                                  aria-label="우편번호"
                                  className={inputClassName}
                                  placeholder="우편번호"
                                  readOnly
                                  required
                                  value={registerZipCode}
                                />
                                <button
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100"
                                  onClick={handleAddressSearch}
                                  type="button"
                                >
                                  주소 검색
                                </button>
                              </div>
                              <input
                                aria-label="기본 주소"
                                className={inputClassName}
                                placeholder="기본 주소"
                                readOnly
                                required
                                value={registerAddress}
                              />
                              <input
                                aria-label="상세 주소"
                                className={inputClassName}
                                onChange={(event) => setRegisterDetailAddress(event.target.value)}
                                placeholder="상세 주소를 입력하세요"
                                value={registerDetailAddress}
                              />
                            </div>
                          </section>

                          <section className="space-y-4 pt-6">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">약관 동의</p>
                              <span className="text-xs text-slate-500">필수 입력</span>
                            </div>
                            <div className="grid gap-3">
                              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-50">
                                <input
                                  checked={registerTermsAgreed}
                                  className="mt-1 h-4 w-4 accent-slate-900"
                                  onChange={(event) => setRegisterTermsAgreed(event.target.checked)}
                                  type="checkbox"
                                />
                                <span>이용약관(필수)을 확인하고 동의합니다.</span>
                              </label>
                              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-50">
                                <input
                                  checked={registerPrivacyAgreed}
                                  className="mt-1 h-4 w-4 accent-slate-900"
                                  onChange={(event) =>
                                    setRegisterPrivacyAgreed(event.target.checked)
                                  }
                                  type="checkbox"
                                />
                                <span>개인정보 처리방침(필수)에 동의합니다.</span>
                              </label>
                            </div>
                          </section>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={registerLoading}
                          type="submit"
                        >
                          {registerLoading ? "가입 중..." : "회원가입"}
                        </button>

                        {registerMessage && (
                          <p className={statusClassName.success}>{registerMessage}</p>
                        )}
                        {registerError && <p className={statusClassName.error}>{registerError}</p>}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
