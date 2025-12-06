"use client";

import { useRef } from "react";

export type PhoneNumberParts = {
  first: string;
  middle: string;
  last: string;
};

type PhoneNumberInputProps = {
  parts: PhoneNumberParts;
  onChange: (next: PhoneNumberParts) => void;
  inputClassName?: string;
  containerClassName?: string;
  dividerClassName?: string;
  required?: boolean;
  placeholders?: {
    first?: string;
    middle?: string;
    last?: string;
  };
  maxLengths?: {
    first?: number;
    middle?: number;
    last?: number;
  };
  ariaLabels?: {
    first?: string;
    middle?: string;
    last?: string;
  };
};

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

export default function PhoneNumberInput({
  parts,
  onChange,
  inputClassName = "",
  containerClassName = "grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3",
  dividerClassName = "text-lg font-semibold text-slate-400",
  required = false,
  placeholders = {
    first: "010",
    middle: "0000",
    last: "0000",
  },
  maxLengths = {
    first: 3,
    middle: 4,
    last: 4,
  },
  ariaLabels = {
    first: "전화번호 앞자리",
    middle: "전화번호 중간자리",
    last: "전화번호 마지막자리",
  },
}: PhoneNumberInputProps) {
  const firstRef = useRef<HTMLInputElement | null>(null);
  const middleRef = useRef<HTMLInputElement | null>(null);
  const lastRef = useRef<HTMLInputElement | null>(null);

  const baseInputClass = ["w-full text-center", inputClassName].filter(Boolean).join(" ");
  const nextMaxFirst = maxLengths.first ?? 3;
  const nextMaxMiddle = maxLengths.middle ?? 4;

  return (
    <div className={containerClassName}>
      <input
        ref={firstRef}
        aria-label={ariaLabels.first}
        className={baseInputClass}
        inputMode="numeric"
        maxLength={maxLengths.first ?? 3}
        onChange={(event) => {
          const sanitized = sanitizeDigits(event.target.value);
          onChange({ ...parts, first: sanitized });
          if (sanitized.length === nextMaxFirst) {
            middleRef.current?.focus();
          }
        }}
        placeholder={placeholders.first}
        required={required}
        value={parts.first}
      />
      <span className={dividerClassName} aria-hidden>
        -
      </span>
      <input
        ref={middleRef}
        aria-label={ariaLabels.middle}
        className={baseInputClass}
        inputMode="numeric"
        maxLength={maxLengths.middle ?? 4}
        onChange={(event) => {
          const sanitized = sanitizeDigits(event.target.value);
          onChange({ ...parts, middle: sanitized });
          if (sanitized.length === nextMaxMiddle) {
            lastRef.current?.focus();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Backspace" && parts.middle.length === 0) {
            firstRef.current?.focus();
          }
        }}
        placeholder={placeholders.middle}
        required={required}
        value={parts.middle}
      />
      <span className={dividerClassName} aria-hidden>
        -
      </span>
      <input
        ref={lastRef}
        aria-label={ariaLabels.last}
        className={baseInputClass}
        inputMode="numeric"
        maxLength={maxLengths.last ?? 4}
        onChange={(event) => {
          const sanitized = sanitizeDigits(event.target.value);
          onChange({ ...parts, last: sanitized });
        }}
        onKeyDown={(event) => {
          if (event.key === "Backspace" && parts.last.length === 0) {
            middleRef.current?.focus();
          }
        }}
        placeholder={placeholders.last}
        required={required}
        value={parts.last}
      />
    </div>
  );
}
