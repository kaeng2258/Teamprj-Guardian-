"use client";

import { useRef } from "react";
import { Group, Input, Text } from "@mantine/core";

export type PhoneNumberParts = {
  first: string;
  middle: string;
  last: string;
};

type PhoneNumberInputProps = {
  parts: PhoneNumberParts;
  onChange: (next: PhoneNumberParts) => void;
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
  const firstRef = useRef<HTMLInputElement>(null);
  const middleRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const nextMaxFirst = maxLengths.first ?? 3;
  const nextMaxMiddle = maxLengths.middle ?? 4;

  const handleChange = (
    field: keyof PhoneNumberParts,
    value: string,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    const sanitized = sanitizeDigits(value);
    const newParts = { ...parts, [field]: sanitized };
    onChange(newParts);

    if (
      sanitized.length === (maxLengths[field] ?? (field === "first" ? 3 : 4)) &&
      nextRef?.current
    ) {
      nextRef.current.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    prevRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === "Backspace" && currentValue.length === 0 && prevRef?.current) {
      prevRef.current.focus();
    }
  };

  return (
    <Group gap={6} wrap="nowrap" align="center" w="100%">
      <Input
        ref={firstRef}
        placeholder={placeholders.first}
        value={parts.first}
        onChange={(e) => handleChange("first", e.target.value, middleRef)}
        required={required}
        aria-label={ariaLabels.first}
        maxLength={maxLengths.first}
        inputMode="numeric"
        style={{ flex: 1, textAlign: 'center' }}
        styles={{ input: { textAlign: 'center', padding: '0 4px' } }}
      />
      <Text c="dimmed">-</Text>
      <Input
        ref={middleRef}
        placeholder={placeholders.middle}
        value={parts.middle}
        onChange={(e) => handleChange("middle", e.target.value, lastRef)}
        onKeyDown={(e) => handleKeyDown(e, parts.middle, firstRef)}
        required={required}
        aria-label={ariaLabels.middle}
        maxLength={maxLengths.middle}
        inputMode="numeric"
        style={{ flex: 1, textAlign: 'center' }}
        styles={{ input: { textAlign: 'center', padding: '0 4px' } }}
      />
      <Text c="dimmed">-</Text>
      <Input
        ref={lastRef}
        placeholder={placeholders.last}
        value={parts.last}
        onChange={(e) => handleChange("last", e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, parts.last, middleRef)}
        required={required}
        aria-label={ariaLabels.last}
        maxLength={maxLengths.last}
        inputMode="numeric"
        style={{ flex: 1, textAlign: 'center' }}
        styles={{ input: { textAlign: 'center', padding: '0 4px' } }}
      />
    </Group>
  );
}
