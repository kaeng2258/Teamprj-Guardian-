package com.ll.guardian.domain.video.repository;

import com.ll.guardian.domain.video.entity.VideoSession;
import com.ll.guardian.domain.video.VideoSessionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoSessionRepository extends JpaRepository<VideoSession, Long> {

    List<VideoSession> findByCallerIdOrReceiverId(Long callerId, Long receiverId);

    List<VideoSession> findByStatus(VideoSessionStatus status);
}
