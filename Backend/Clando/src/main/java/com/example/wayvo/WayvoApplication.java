package com.example.wayvo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WayvoApplication {

	public static void main(String[] args) {
		SpringApplication.run(WayvoApplication.class, args);
	}

}