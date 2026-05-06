package com.naodab.productservice.controllers;

import org.springframework.boot.SpringBootConfiguration;

/**
 * Spring Boot searches upward from the test class package for {@code @SpringBootConfiguration}.
 * This class sits in {@code com.naodab.productservice.controllers} so {@code @WebMvcTest} in
 * this package does not bootstrap {@link com.naodab.productservice.ProductserviceApplication}
 * (which would component-scan the whole service and defeat the MVC slice).
 */
@SpringBootConfiguration
public class ControllersWebMvcTestConfiguration {}
