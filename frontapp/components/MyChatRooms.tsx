"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveProfileImageUrl } from "@/lib/image";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
  Loader,
  Alert,
  Paper,
  Box,
  Indicator,
} from "@mantine/core";

// ... Types ...
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ChatThread = {
  roomId: number;
  clientId: number;
  managerId: number;
  clientName?: string | null;
  managerName?: string | null;
  clientProfileImageUrl?: string | null;
  managerProfileImageUrl?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  readByClient?: boolean;
  readByManager?: boolean;
};

type MyChatRoomsProps = {
  role: "CLIENT" | "MANAGER";
  userId?: number | null;
  managerProfileId?: number | null;
  refreshToken?: number;
};

export default function MyChatRooms({
  role,
  userId,
  managerProfileId,
  refreshToken,
}: MyChatRoomsProps) {
  const effectiveUserId = React.useMemo(
    () => (role === "MANAGER" ? userId ?? managerProfileId ?? null : userId ?? null),
    [role, userId, managerProfileId],
  );
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Record<number, string>>({});
  const [leaving, setLeaving] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [bookmarksHydrated, setBookmarksHydrated] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const defaultProfileImage =
    resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";
  const bookmarkKey = useMemo(
    () => (effectiveUserId ? `guardian.bookmarkedRooms.${role}.${String(effectiveUserId)}` : null),
    [effectiveUserId, role],
  );

  const getProfileImage = (url?: string | null) =>
    url && typeof url === "string" && url.trim().length > 0
      ? resolveProfileImageUrl(url) || defaultProfileImage
      : defaultProfileImage;

  const sortThreads = (list: ChatThread[], marks: number[]) => {
    const star = new Set(marks);
    return [...list].sort((a, b) => {
      const aStar = star.has(a.roomId) ? 1 : 0;
      const bStar = star.has(b.roomId) ? 1 : 0;
      if (aStar !== bStar) return bStar - aStar;
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  };

  const handleMarkThreadAsRead = useCallback(
    async (roomId: number) => {
      if (!effectiveUserId) return;
      try {
        await fetch(
          `${API_BASE_URL}/api/chat/rooms/${roomId}/read?userId=${encodeURIComponent(
            String(effectiveUserId),
          )}`,
          { method: "POST" },
        );
      } catch {
        // ignore
      } finally {
        setThreads((prev) =>
          prev.map((t) =>
            t.roomId === roomId
              ? {
                ...t,
                readByManager: role === "MANAGER" ? true : t.readByManager,
                readByClient: role === "CLIENT" ? true : t.readByClient,
              }
              : t,
          ),
        );
      }
    },
    [effectiveUserId, role],
  );

  useEffect(() => {
    if (!effectiveUserId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chat/threads?userId=${encodeURIComponent(
            String(effectiveUserId),
          )}`,
        );
        if (!res.ok) {
          throw new Error("채팅 목록을 불러오지 못했습니다.");
        }
        const data: ChatThread[] = await res.json();
        if (!active) return;
        const filtered =
          role === "MANAGER"
            ? data.filter((t) => t.managerId === effectiveUserId)
            : data.filter((t) => t.clientId === effectiveUserId);
        setThreads(sortThreads(filtered, bookmarked));
      } catch (e) {
        if (!active) return;
        setErr(e instanceof Error ? e.message : "채팅 목록을 불러오지 못했습니다.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [role, userId, managerProfileId, refreshToken, effectiveUserId]);

  useEffect(() => {
    const loadProfileImages = async () => {
      const targets = threads
        .map((t) => (role === "MANAGER" ? t.clientId : t.managerId))
        .filter((id) => id && !profileImages[id]);
      if (targets.length === 0) return;
      for (const id of targets) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
          if (!res.ok) continue;
          const detail: { profileImageUrl?: string | null } = await res.json();
          setProfileImages((prev) => ({
            ...prev,
            [id]: getProfileImage(detail.profileImageUrl),
          }));
        } catch {
          // ignore
        }
      }
    };
    void loadProfileImages();
  }, [threads, role]);

  useEffect(() => {
    if (!bookmarkKey) return;
    try {
      const raw = window.localStorage.getItem(bookmarkKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0);
          setBookmarked(cleaned);
          setThreads((prev) => sortThreads(prev, cleaned));
        }
      }
    } catch {
      // ignore
    } finally {
      setBookmarksHydrated(true);
    }
  }, [bookmarkKey]);

  useEffect(() => {
    if (!bookmarkKey || !bookmarksHydrated) return;
    try {
      window.localStorage.setItem(bookmarkKey, JSON.stringify(bookmarked));
    } catch {
      // ignore
    }
    setThreads((prev) => sortThreads(prev, bookmarked));
  }, [bookmarkKey, bookmarked, bookmarksHydrated]);

  const handleLeaveRoom = async (roomId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!effectiveUserId) {
      setActionError("사용자 정보를 확인할 수 없습니다.");
      return;
    }
    if (!window.confirm("이 채팅방에서 나가시겠습니까?")) return;
    setLeaving(roomId);
    setActionError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/rooms/${roomId}?userId=${encodeURIComponent(
          String(effectiveUserId),
        )}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        throw new Error("채팅방에서 나갈 수 없습니다.");
      }
      setThreads((prev) => prev.filter((t) => t.roomId !== roomId));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "채팅방에서 나갈 수 없습니다.");
    } finally {
      setLeaving(null);
    }
  };

  const toggleBookmark = (roomId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!bookmarkKey) return;
    if (!bookmarksHydrated) return;
    setBookmarked((prev) => {
      const next = prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId];
      setThreads((current) => sortThreads(current, next));
      return next;
    });
  };

  const filteredThreads = useMemo(() => {
    if (role !== "CLIENT") return threads;
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return threads;
    return threads.filter((t) => {
      const name = t.managerName ?? "";
      const fields = [name, t.lastMessageSnippet ?? "", String(t.roomId ?? "")];
      return fields.some((field) => field.toLowerCase().includes(keyword));
    });
  }, [role, searchKeyword, threads]);

  return (
    <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
      <Group justify="space-between" mb="md">
        <Box>
          <Title order={4}>내 채팅방</Title>
          <Text size="xs" c="dimmed">현재 배정된 상대와의 대화</Text>
        </Box>
        {role === "CLIENT" && (
          <TextInput size="xs" placeholder="검색..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.currentTarget.value)} />
        )}
      </Group>

      {loading && <Text size="sm" ta="center">목록을 불러오는 중...</Text>}
      {err && <Alert color="red">{err}</Alert>}

      {!loading && !err && threads.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">채팅방이 없습니다.</Text>
      )}

      <Stack gap="sm">
        {threads.map((t) => {
          const roomId = t.roomId;
          const otherName = role === "MANAGER" ? t.clientName : t.managerName;
          const displayName = otherName && otherName.trim().length > 0 ? otherName : "이름 미등록";
          const otherId = role === "MANAGER" ? t.clientId : t.managerId;
          const avatar =
            role === "MANAGER"
              ? getProfileImage(profileImages[otherId] ?? t.clientProfileImageUrl)
              : getProfileImage(profileImages[otherId] ?? t.managerProfileImageUrl);
          const lastTime = t.lastMessageAt ?? undefined;
          const lastSnippet = t.lastMessageSnippet ?? "";
          const unread = role === "MANAGER" ? t.readByManager === false : t.readByClient === false;
          const isBookmarked = bookmarked.includes(roomId);

          return (
            <Paper
              component={Link}
              href={`/chat/${roomId}`}
              target="_blank"
              rel="noopener noreferrer"
              key={roomId}
              withBorder
              p="sm"
              radius="md"
              onClick={() => void handleMarkThreadAsRead(roomId)}
              style={{ textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s' }}
              onMouseEnter={(e: any) => e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'}
              onMouseLeave={(e: any) => e.currentTarget.style.boxShadow = 'none'}
            >
              <Group align="center" wrap="nowrap">
                <Indicator disabled={!unread} color="red" size={10} offset={4} withBorder>
                  <Avatar src={avatar} size="md" radius="xl" />
                </Indicator>

                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" align="center" mb={2}>
                    <Text fw={600} size="sm" truncate>{displayName}</Text>
                    <Group gap="xs">
                      <UnstyledButton onClick={(e) => toggleBookmark(roomId, e)}>
                        <Text c={isBookmarked ? "yellow" : "gray.4"}>★</Text>
                      </UnstyledButton>
                      {lastTime && (
                        <Text size="xs" c="dimmed">
                          {new Date(lastTime).toLocaleDateString()}
                        </Text>
                      )}
                    </Group>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {lastSnippet || "대화가 없습니다."}
                    </Text>
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-xs"
                      loading={leaving === roomId}
                      onClick={(e) => handleLeaveRoom(roomId, e)}
                    >
                      나가기
                    </Button>
                  </Group>
                </Box>
              </Group>
            </Paper>
          );
        })}
      </Stack>
    </Card>
  );
}
