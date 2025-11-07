// src/main/java/com/ll/guardian/domain/chat/controller/ChatPageController.java
package com.ll.guardian.domain.chat.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ChatPageController {

    @GetMapping({"/chat", "/chat.html"})
    public String chatPage() {
        // templates/chat.html 렌더링 (확장자/경로 제외한 뷰 이름)
        return "chat";
    }
}
