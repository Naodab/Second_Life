package com.naodab.uploadservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"com.naodab.uploadservice", "com.naodab.commonservice"})
public class UploadserviceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UploadserviceApplication.class, args);
	}

}
