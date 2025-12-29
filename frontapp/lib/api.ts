// frontapp/lib/api.ts

import { fetchWithAuth } from "./auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// 공통 fetch 래퍼
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} 호출 실패: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

/* ---------- 타입 ---------- */

export type ChatRoomSummary = {
  id: number;
  name: string;
  lastMessage?: string;
  updatedAt?: string;
};

export type ChatMessageDTO = {
  messageId?: number;
  id?: number;
  roomId?: number;
  senderId: number;
  senderName?: string | null;
  content: string;
  messageType?: string | null;
  fileUrl?: string | null;
  createdAt?: string;
  sentAt?: string;
};

export type DrugSummaryItem = {
  itemSeq: string;
  itemName: string;
  entpName?: string;
  imgUrl?: string;
};

export type DrugDetail = {
  itemSeq: string;             // 품목코드
  itemName: string;            // 제품명
  entpName?: string;           // 업체명
  className?: string;          // 분류
  chart?: string;              // 제형
  itemImage?: string;          // 이미지
  etcOtcName?: string;         // 전문/일반
  materialName?: string;       // 주요성분
  openDe?: string;             // 공개일자
  updateDe?: string;           // 수정일자

  // 추가 텍스트 필드(백엔드 DTO 확장 대비)
  efcyQesitm?: string;         // 효능/효과
  useMethodQesitm?: string;    // 복용방법
  atpnWarnQesitm?: string;     // 경고
  atpnQesitm?: string;         // 주의사항
  intrcQesitm?: string;        // 상호작용
  seQesitm?: string;           // 부작용
  depositMethodQesitm?: string;// 보관방법
};

/* ---------- 채팅 관련 REST ---------- */

/**
 * 백엔드 ChatController:
 * GET /api/chat/threads (토큰 사용자 기준)
 * -> List<ChatThreadResponse>
 * 프론트에서 바로 쓰기 좋게 RoomSummary 타입으로 변환
 */
async function listRooms() {
  type ThreadResponse = {
    roomId: number;
    title: string;
    lastMessage?: string;
    updatedAt?: string;
  };

  const threads = await req<ThreadResponse[]>(
    `/api/chat/threads`,
  );

  const rooms: ChatRoomSummary[] = threads.map((t) => ({
    id: t.roomId,
    name: t.title,
    lastMessage: t.lastMessage,
    updatedAt: t.updatedAt,
  }));

  return { rooms };
}

/**
 * 방 히스토리
 * 백엔드에서 MessagesResponse(record messages: List<ChatMessageResponse>) 반환
 * { "messages": [ ... ] } 형태로 내려온다고 가정
 */
function getRoomHistory(roomId: number) {
  return req<{
    messages: ChatMessageDTO[];
  }>(`/api/chat/rooms/${roomId}/messages`);
}

// 내꺼 방목록 (토큰 기준)
function listMyRoomsForClient(_clientId: number) {
  return listRooms();
}

// 매니저 본인 방목록 (토큰 기준)
function listMyRoomsForManager(_managerId: number) {
  return listRooms();
}

/* ---------- 의약품 REST ---------- */

/**
 * 검색(페이지 포함)
 * EasyDrugApiController:
 * GET /api/drugs/search?query=...&page=1&size=10
 * -> { items: DrugSummary[] }
 */
function drugSearch(query: string, page = 1, size = 10) {
  return req<{
    items: DrugSummaryItem[];
  }>(
    `/api/drugs/search?query=${encodeURIComponent(
      query,
    )}&page=${page}&size=${size}`,
  );
}

/**
 * 상세
 * GET /api/drugs/{itemSeq}
 */
function drugDetail(itemSeq: string) {
  return req<DrugDetail>(`/api/drugs/${encodeURIComponent(itemSeq)}`);
}

/**
 * 상세 페이지에서 간단 검색 (최대 size개만)
 */
function drugSearchSimple(query: string, size = 10) {
  return req<{
    items: DrugSummaryItem[];
  }>(
    `/api/drugs/search?query=${encodeURIComponent(
      query,
    )}&size=${size}`,
  );
}

/* ---------- api 객체 export ---------- */

export const api = {
  // 채팅
  listRooms,
  getRoomHistory,
  listMyRoomsForClient,
  listMyRoomsForManager,

  // 의약품
  drugSearch,
  drugDetail,
  drugSearchSimple,
};
