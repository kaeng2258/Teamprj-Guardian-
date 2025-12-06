// frontapp/lib/api.ts

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// 공통 fetch 래퍼
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} 실패: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

/* ---------- 타입 정의 ---------- */

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

/* ---------- 채팅 관련 REST ---------- */

/**
 * 백엔드 ChatController:
 * GET /api/chat/threads?userId=...
 * -> List<ChatThreadResponse>
 * 를 이용해서 프론트에서 쓰기 좋은 RoomSummary 형태로 변환
 */
async function listRooms(params: { managerId?: number; clientId?: number }) {
  const userId = params.managerId ?? params.clientId;
  if (!userId) {
    throw new Error("listRooms 호출 시 managerId 또는 clientId 중 하나는 필요합니다.");
  }

  // 서버에서 내려주는 ThreadResponse 가 이런 모양이라고 가정
  type ThreadResponse = {
    roomId: number;
    title: string;
    lastMessage?: string;
    updatedAt?: string;
  };

  const threads = await req<ThreadResponse[]>(
    `/api/chat/threads?userId=${userId}`,
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
 * 방 이력
 * 백엔드에서 MessagesResponse(record messages: List<ChatMessageResponse>) 로
 * { "messages": [ ... ] } 형태로 내려준다는 가정
 */
function getRoomHistory(roomId: number) {
  return req<{
    messages: ChatMessageDTO[];
  }>(`/api/chat/rooms/${roomId}/messages`);
}

// 클라이언트 본인 방 목록
function listMyRoomsForClient(clientId: number) {
  return listRooms({ clientId });
}

// 매니저 본인 방 목록
function listMyRoomsForManager(managerId: number) {
  return listRooms({ managerId });
}

/* ---------- e약은요 REST ---------- */

/**
 * 검색 (페이지 포함)
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
 * 디테일
 * GET /api/drugs/{itemSeq}
 */
function drugDetail(itemSeq: string) {
  return req<any>(`/api/drugs/${encodeURIComponent(itemSeq)}`);
}

/**
 * 디테일 페이지 위젯용: 간단 검색
 * 첫 페이지 기준으로 size개만 가져오기
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

  // e약은요
  drugSearch,
  drugDetail,
  drugSearchSimple,
};
