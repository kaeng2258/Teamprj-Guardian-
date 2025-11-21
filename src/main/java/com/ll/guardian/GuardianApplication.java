package com.ll.guardian;

import com.ll.guardian.domain.edrug.properties.EasyDrugProperties;
import com.ll.guardian.global.config.properties.WebPushProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableConfigurationProperties({EasyDrugProperties.class, WebPushProperties.class})
@EnableScheduling
public class GuardianApplication {

	public static void main(String[] args) {
		SpringApplication.run(GuardianApplication.class, args);
	}

}
