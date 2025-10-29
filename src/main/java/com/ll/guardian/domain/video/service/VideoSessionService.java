package com.ll.guardian.domain.video.service;

import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.domain.video.dto.VideoSessionRequest;
import com.ll.guardian.domain.video.dto.VideoSessionResponse;
import com.ll.guardian.domain.video.dto.VideoSessionStatusUpdateRequest;
import com.ll.guardian.domain.video.entity.VideoSession;
import com.ll.guardian.domain.video.repository.VideoSessionRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VideoSessionService {

    private final VideoSessionRepository videoSessionRepository;
    private final UserRepository userRepository;

    public VideoSessionService(VideoSessionRepository videoSessionRepository, UserRepository userRepository) {
        this.videoSessionRepository = videoSessionRepository;
        this.userRepository = userRepository;
    }

    public VideoSessionResponse create(VideoSessionRequest request) {
        User caller = getUser(request.callerId());
        User receiver = getUser(request.receiverId());

        VideoSession session = VideoSession.builder()
                .caller(caller)
                .receiver(receiver)
                .callType(request.callType())
                .status(com.ll.guardian.domain.video.VideoSessionStatus.REQUESTED)
                .offerSdp(request.offerSdp())
                .startedAt(LocalDateTime.now())
                .build();

        VideoSession saved = videoSessionRepository.save(session);
        return VideoSessionResponse.from(saved);
    }

    public VideoSessionResponse updateStatus(VideoSessionStatusUpdateRequest request) {
        VideoSession session = videoSessionRepository
                .findById(request.sessionId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "영상 통화를 찾을 수 없습니다."));
        session.updateStatus(request.status(), request.answerSdp(), request.durationSeconds(), request.qualityScore());
        return VideoSessionResponse.from(session);
    }

    @Transactional(readOnly = true)
    public List<VideoSessionResponse> findSessions(Long userId) {
        return videoSessionRepository.findByCallerIdOrReceiverId(userId, userId).stream()
                .map(VideoSessionResponse::from)
                .collect(Collectors.toList());
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
