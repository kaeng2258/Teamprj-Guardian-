"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import {
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Group,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Grid,
  ThemeIcon,
  rem,
  LoadingOverlay,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

// Let's assume the user doesn't have @tabler/icons-react installed (package.json didn't show it).
// I will use FontAwesome for icons since it's in package.json.

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
      Postcode: new (config: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => {
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
  const isMobile = useMediaQuery("(max-width: 50em)");

  const [activeTab, setActiveTab] = useState<AuthMode | null>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerRole, setRegisterRole] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState("");
  const [registerBirthDate, setRegisterBirthDate] = useState("");
  const [registerGender, setRegisterGender] = useState<string | null>(null);
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
  const [registerBirthDateError, setRegisterBirthDateError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmStatus, setConfirmStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [confirmMessage, setConfirmMessage] = useState("");

  const today = useMemo(
    () =>
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0],
    []
  );

  // Toggle state for sliding animation
  const [isSignUp, setIsSignUp] = useState(false);

  // Sync activeTab with isSignUp for mobile tabs
  useEffect(() => {
    setActiveTab(isSignUp ? "register" : "login");
  }, [isSignUp]);

  const handleMobileTabChange = (value: string | null) => {
    const mode = value as AuthMode;
    // Don't change if null
    if (!mode) return;

    if (mode === "login") {
      setLoginError("");
      setRegisterMessage("");
      setIsSignUp(false);
    } else {
      setRegisterError("");
      setRegisterBirthDateError("");
      setLoginMessage("");
      setIsSignUp(true);
    }
    setActiveTab(mode);
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
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleRegisterBirthDateChange = (value: string) => {
    setRegisterBirthDate(value);
    if (value && value > today) {
      const msg = "생년월일은 오늘 이후 날짜를 선택할 수 없습니다.";
      setRegisterBirthDateError(msg);
      setRegisterError(msg);
    } else {
      setRegisterBirthDateError("");
      if (registerError === "생년월일은 오늘 이후 날짜를 선택할 수 없습니다.") {
        setRegisterError("");
      }
    }
  };

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

        window.localStorage.setItem(
          "guardian_auth",
          JSON.stringify(authPayload)
        );
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
      setLoginError(
        "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
      );
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
    setRegisterBirthDateError("");
    const registerPhone = [registerPhone1, registerPhone2, registerPhone3].join(
      "-"
    );

    if (!registerRole) {
      setRegisterError("회원 유형을 선택해주세요.");
      return;
    }

    if (!registerBirthDate) {
      setRegisterError("생년월일을 입력해주세요.");
      return;
    }

    if (registerBirthDate > today) {
      const msg = "생년월일은 오늘 이후 날짜를 선택할 수 없습니다.";
      setRegisterBirthDateError(msg);
      setRegisterError(msg);
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

    const confirmCheck = validateConfirmPassword(
      registerConfirmPassword,
      registerPassword
    );
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
      setRegisterError(
        "이용약관과 개인정보 처리방침에 모두 동의해야 합니다."
      );
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
      setRegisterMessage(
        `${payload.name}님, 가입이 완료되었습니다. 로그인 해주세요.`
      );
      setLoginEmail(payload.email);
      setActiveTab("login");
      setRegisterZipCode("");
      setRegisterAddress("");
      setRegisterDetailAddress("");
      setRegisterRole(null);
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterBirthDate("");
      setRegisterGender(null);
      setEmailCheckStatus("idle");
      setEmailCheckMessage("");
      setCheckedEmail("");
      setPasswordStatus("idle");
      setPasswordMessage("");
      setConfirmStatus("idle");
      setConfirmMessage("");
    } catch (error) {
      setRegisterError(
        "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleAddressSearch = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.daum || !window.daum.Postcode) {
      alert(
        "주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
      );
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
        `${API_BASE_URL}/api/users/check-email?email=${encodeURIComponent(
          registerEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        setEmailCheckStatus("unavailable");
        setEmailCheckMessage(errorMessage);
        return;
      }

      const data: { available: boolean; message: string } =
        await response.json();
      setCheckedEmail(registerEmail);
      setEmailCheckStatus(data.available ? "available" : "unavailable");
      setEmailCheckMessage(data.message);
    } catch (error) {
      setEmailCheckStatus("unavailable");
      setEmailCheckMessage(
        "이메일 중복 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  // Reusable Form Content
  // We wrap them in divs to apply specific styles for desktop/mobile containers
  const LoginContent = (
    <form onSubmit={handleLoginSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Stack gap="lg" align="center" mb="xl">
        <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>로그인</Title>
        <Text c="dimmed" size="sm">계정이 있으신가요? 이메일로 로그인하세요.</Text>
      </Stack>
      <Stack w="100%">
        <TextInput
          label="이메일"
          placeholder="input@email.com"
          required
          value={loginEmail}
          onChange={(event) => setLoginEmail(event.currentTarget.value)}
          variant="filled"
        />
        <PasswordInput
          label="비밀번호"
          placeholder="비밀번호 입력"
          required
          value={loginPassword}
          onChange={(event) => setLoginPassword(event.currentTarget.value)}
          variant="filled"
        />

        {loginError && (
          <Paper p="sm" bg="red.0" c="red.9" withBorder style={{ borderColor: 'var(--mantine-color-red-2)' }}>
            <Group gap="xs">
              <FontAwesomeIcon icon={faTimes} />
              <Text size="sm">{loginError}</Text>
            </Group>
          </Paper>
        )}

        {loginMessage && (
          <Paper p="sm" bg="teal.0" c="teal.9" withBorder style={{ borderColor: 'var(--mantine-color-teal-2)' }}>
            <Group gap="xs">
              <FontAwesomeIcon icon={faCheck} />
              <Text size="sm">{loginMessage}</Text>
            </Group>
          </Paper>
        )}

        <Button type="submit" fullWidth mt="md" size="md" loading={loginLoading} radius="xl" bg="indigo.6">
          로그인
        </Button>
      </Stack>
    </form>
  );

  const RegisterContent = (
    <form onSubmit={handleRegisterSubmit} style={{ width: '100%', minHeight: '100%', padding: '2rem 1rem' }}>
      <Stack gap="sm" align="center" mb="lg">
        <Title order={2} fw={800} style={{ letterSpacing: '-0.5px' }}>회원가입</Title>
        <Text c="dimmed" size="sm">Guardian의 회원이 되어 서비스를 이용해보세요.</Text>
      </Stack>

      <Stack gap="md" w="100%">
        {/* Basic Info */}
        <Text fw={700} size="sm" c="gray.7">기본 정보</Text>
        <Group grow preventGrowOverflow={false} wrap="wrap">
          <TextInput
            label="이름"
            placeholder="홍길동"
            required
            value={registerName}
            onChange={(e) => setRegisterName(e.currentTarget.value)}
            variant="filled"
          />
          <TextInput
            label="생년월일"
            type="date"
            required
            max={today}
            value={registerBirthDate}
            onChange={(e) => handleRegisterBirthDateChange(e.currentTarget.value)}
            error={registerBirthDateError}
            variant="filled"
          />
        </Group>

        <Group grow>
          <Select
            label="성별"
            placeholder="선택"
            data={[
              { value: 'MALE', label: '남성' },
              { value: 'FEMALE', label: '여성' },
            ]}
            value={registerGender}
            onChange={setRegisterGender}
            required
            variant="filled"
          />
          <Box>
            <Text size="sm" fw={500} mb={3}>연락처 <Text span c="red">*</Text></Text>
            <PhoneNumberInput
              parts={{ first: registerPhone1, middle: registerPhone2, last: registerPhone3 }}
              onChange={(parts) => {
                setRegisterPhone1(parts.first);
                setRegisterPhone2(parts.middle);
                setRegisterPhone3(parts.last);
              }}
              required
            />
          </Box>
        </Group>

        {/* Account Info */}
        <Text fw={700} size="sm" c="gray.7" mt="sm">계정 정보</Text>

        <Stack gap="xs">
          <Text size="sm" fw={500}>이메일 <Text span c="red">*</Text></Text>
          <Group align="flex-start" wrap="nowrap">
            <TextInput
              placeholder="you@example.com"
              required
              value={registerEmail}
              onChange={(e) => {
                setRegisterEmail(e.currentTarget.value);
                if (e.currentTarget.value !== checkedEmail) {
                  setEmailCheckStatus("idle");
                  setEmailCheckMessage("");
                }
              }}
              style={{ flex: 1 }}
              error={emailCheckStatus === "unavailable" ? emailCheckMessage : null}
              variant="filled"
            />
            <Button
              onClick={handleEmailCheck}
              disabled={emailCheckStatus === "checking" || !registerEmail}
              variant="outline"
              color="indigo"
            >
              {emailCheckStatus === "checking" ? "확인" : "중복 확인"}
            </Button>
          </Group>
          {emailCheckStatus === "available" && (
            <Text size="xs" c="teal">{emailCheckMessage}</Text>
          )}
        </Stack>

        <Group grow>
          <PasswordInput
            label="비밀번호"
            placeholder="8자 이상 영문/숫자"
            required
            value={registerPassword}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setRegisterPassword(val);
              const res = validatePassword(val);
              setPasswordStatus(res.valid ? "valid" : "invalid");
              setPasswordMessage(res.message);
              if (registerConfirmPassword) {
                const confirmRes = validateConfirmPassword(registerConfirmPassword, val);
                setConfirmStatus(confirmRes.valid ? "valid" : "invalid");
                setConfirmMessage(confirmRes.message);
              }
            }}
            error={passwordStatus === "invalid" && passwordMessage}
            variant="filled"
          />
          <PasswordInput
            label="확인"
            placeholder="재입력"
            required
            value={registerConfirmPassword}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setRegisterConfirmPassword(val);
              const res = validateConfirmPassword(val, registerPassword);
              setConfirmStatus(res.valid ? "valid" : "invalid");
              setConfirmMessage(res.message);
            }}
            error={confirmStatus === "invalid" && confirmMessage}
            variant="filled"
          />
        </Group>

        <Select
          label="가입 유형"
          placeholder="선택하세요"
          data={[
            { value: 'CLIENT', label: '일반 (본인/보호자)' },
            { value: 'MANAGER', label: '매니저 (간병 전문인)' },
          ]}
          value={registerRole}
          onChange={setRegisterRole}
          required
          variant="filled"
        />

        {/* Address */}
        <Text fw={700} size="sm" c="gray.7" mt="sm">주소</Text>
        <Group align="flex-end">
          <TextInput
            label="우편번호"
            readOnly
            value={registerZipCode}
            placeholder="00000"
            style={{ flex: 1 }}
            variant="filled"
          />
          <Button onClick={handleAddressSearch} variant="light" color="gray">주소 검색</Button>
        </Group>
        <TextInput
          label="기본 주소"
          readOnly
          value={registerAddress}
          placeholder="주소 검색 버튼을 눌러주세요"
          variant="filled"
        />
        <TextInput
          label="상세 주소"
          value={registerDetailAddress}
          onChange={(e) => setRegisterDetailAddress(e.currentTarget.value)}
          placeholder="상세 주소를 입력하세요"
          variant="filled"
        />

        {/* Agreements */}
        <Paper withBorder p="md" mt="md" radius="md" bg="gray.0">
          <Stack gap="xs">
            <Checkbox
              size="xs"
              label="이용약관(필수)을 확인하고 동의합니다."
              checked={registerTermsAgreed}
              onChange={(e) => setRegisterTermsAgreed(e.currentTarget.checked)}
            />
            <Checkbox
              size="xs"
              label="개인정보 처리방침(필수)에 동의합니다."
              checked={registerPrivacyAgreed}
              onChange={(e) => setRegisterPrivacyAgreed(e.currentTarget.checked)}
            />
          </Stack>
        </Paper>

        <Button type="submit" fullWidth mt="lg" size="md" loading={registerLoading} radius="xl" bg="indigo.6">
          {registerLoading ? "가입 중..." : "회원가입 완료"}
        </Button>

        {registerError && (
          <Text c="red" size="sm" ta="center">{registerError}</Text>
        )}
        {registerMessage && (
          <Text c="teal" size="sm" ta="center">{registerMessage}</Text>
        )}
      </Stack>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 py-10 px-4">
      {/* Container for Sliding Animation (Desktop) */}
      <div
        className={`hidden md:block relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-[1000px] min-h-[750px]`}
      >
        {/* Sign Up Container */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 flex items-center justify-center p-12
            ${isSignUp ? 'translate-x-[100%] opacity-100 z-[5]' : 'opacity-0 z-[1]'}
          `}
        >
          <Box w="100%" h="100%" style={{ overflowY: 'auto' }} className="no-scrollbar">
            {RegisterContent}
          </Box>
        </div>

        {/* Sign In Container */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-1/2 z-[2] flex items-center justify-center p-12
            ${isSignUp ? 'opacity-0 z-0' : 'opacity-100 z-2'}
          `}
        >
          <Box w="100%">
            {LoginContent}
          </Box>
        </div>

        {/* Overlay Container */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100]
            ${isSignUp ? '-translate-x-full' : ''}
          `}
        >
          <div
            className={`bg-gradient-to-br from-slate-900 to-indigo-900 text-white relative -left-[100%] h-full w-[200%] transform transition-transform duration-700 ease-in-out
              ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}
            `}
          >
            {/* Overlay Left */}
            <div
              className={`absolute top-0 flex flex-col items-center justify-center h-full w-1/2 px-12 text-center transform transition-transform duration-700 ease-in-out
                ${isSignUp ? 'translate-x-0' : '-translate-x-[20%]'}
              `}
            >
              <Title order={1} mb="md" style={{ fontSize: '2.5rem' }}>Welcome Back!</Title>
              <Text size="lg" mb="xl">이미 계정이 있으신가요?<br />로그인하고 서비스를 계속 이용하세요.</Text>
              <Button
                variant="outline"
                color="white"
                size="lg"
                radius="xl"
                style={{ borderWidth: '2px' }}
                onClick={() => setIsSignUp(false)}
              >
                로그인하기
              </Button>
            </div>

            {/* Overlay Right */}
            <div
              className={`absolute top-0 right-0 flex flex-col items-center justify-center h-full w-1/2 px-12 text-center transform transition-transform duration-700 ease-in-out
                ${isSignUp ? 'translate-x-[20%]' : 'translate-x-0'}
              `}
            >
              <Title order={1} mb="md" style={{ fontSize: '2.5rem' }}>Hello, Friend!</Title>
              <Text size="lg" mb="xl">아직 회원이 아니신가요?<br />간단한 정보를 입력하고 시작하세요.</Text>
              <Button
                variant="outline"
                color="white"
                size="lg"
                radius="xl"
                style={{ borderWidth: '2px' }}
                onClick={() => setIsSignUp(true)}
              >
                회원가입하기
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout (Tabs) */}
      <div className="block md:hidden w-full max-w-md">
        <Paper radius="lg" p="xl" shadow="md" bg="white">
          <Center mb="xl">
            <Group gap="xs">
              <Image
                alt="Guardian 로고"
                height={32}
                src="/image/logo.png"
                width={32}
              />
              <Text
                size="xl"
                fw={700}
                tt="uppercase"
                c="indigo"
                style={{ letterSpacing: "0.1em" }}
              >
                Guardian
              </Text>
            </Group>
          </Center>

          <Tabs value={activeTab} onChange={handleMobileTabChange} variant="pills" radius="xl" defaultValue="login">
            <Tabs.List grow mb="xl" bg="gray.1" p={4} style={{ borderRadius: 'var(--mantine-radius-xl)' }}>
              <Tabs.Tab value="login" style={{ fontWeight: 600 }}>로그인</Tabs.Tab>
              <Tabs.Tab value="register" style={{ fontWeight: 600 }}>회원가입</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login">
              {LoginContent}
            </Tabs.Panel>

            <Tabs.Panel value="register">
              {RegisterContent}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </div>

      {/* Styles for scrollbar hiding if needed */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
