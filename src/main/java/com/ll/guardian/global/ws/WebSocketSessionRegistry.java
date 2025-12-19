package com.ll.guardian.global.ws;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

@Component
public class WebSocketSessionRegistry {

    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Set<String>> sessionsByUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> userBySession = new ConcurrentHashMap<>();

    public void registerSession(WebSocketSession session) {
        if (session != null) {
            sessions.put(session.getId(), session);
        }
    }

    public void unregisterSession(String sessionId) {
        if (sessionId == null) {
            return;
        }
        sessions.remove(sessionId);
        String user = userBySession.remove(sessionId);
        if (user != null) {
            Set<String> ids = sessionsByUser.get(user);
            if (ids != null) {
                ids.remove(sessionId);
                if (ids.isEmpty()) {
                    sessionsByUser.remove(user, ids);
                }
            }
        }
    }

    public void bindUser(String sessionId, String username) {
        if (sessionId == null || username == null) {
            return;
        }
        userBySession.put(sessionId, username);
        sessionsByUser.computeIfAbsent(username, key -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public boolean isOnline(String username) {
        if (username == null) {
            return false;
        }
        Set<String> ids = sessionsByUser.get(username);
        return ids != null && !ids.isEmpty();
    }

    public void closeSessionsForUser(String username) {
        if (username == null) {
            return;
        }
        Set<String> ids = sessionsByUser.get(username);
        if (ids == null || ids.isEmpty()) {
            return;
        }
        for (String id : ids) {
            closeSession(id);
        }
    }

    public void closeSession(String sessionId) {
        if (sessionId == null) {
            return;
        }
        WebSocketSession session = sessions.get(sessionId);
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException ignored) {
            // Best-effort close.
        }
    }
}
