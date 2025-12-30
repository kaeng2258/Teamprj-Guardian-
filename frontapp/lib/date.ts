const TIMEZONE_REGEX = /([zZ]|[+-]\d{2}:?\d{2})$/;

export const normalizeServerTimestamp = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (TIMEZONE_REGEX.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{4}-\d{2}-\d{2} /.test(trimmed)) {
    return `${trimmed.replace(" ", "T")}Z`;
  }
  return `${trimmed}Z`;
};

export const parseServerDate = (value?: string) => {
  const normalized = normalizeServerTimestamp(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getServerTimeMs = (value?: string) => {
  const date = parseServerDate(value);
  return date ? date.getTime() : 0;
};

export const formatKstTime = (value?: string) => {
  const date = parseServerDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export const formatKstDate = (value?: string) => {
  const date = parseServerDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

export const formatKstDateTime = (value?: string) => {
  const date = parseServerDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};
