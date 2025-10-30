'use client';

import { FormEvent, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();

      if (response.ok) {
        setMessage(payload.message ?? "로그인에 성공했습니다.");
      } else {
        setError(payload.message ?? "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (fetchError) {
      setError("서버와 통신할 수 없습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <main className="w-full max-w-sm px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">로그인</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span>아이디</span>
            <input
              aria-label="아이디"
              className="rounded border border-gray-300 px-3 py-2"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="guardian"
              required
              type="text"
              value={username}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>비밀번호</span>
            <input
              aria-label="비밀번호"
              className="rounded border border-gray-300 px-3 py-2"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password123"
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-green-600" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-red-600" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
