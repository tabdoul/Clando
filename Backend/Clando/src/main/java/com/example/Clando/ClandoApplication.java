package com.example.Clando;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ClandoApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClandoApplication.class, args);
	}

}