package com.naodab.bookingservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({ "com.naodab.bookingservice", "com.naodab.commonservice" })
public class BookingserviceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookingserviceApplication.class, args);
	}

}
