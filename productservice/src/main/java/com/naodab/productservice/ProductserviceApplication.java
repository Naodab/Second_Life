package com.naodab.productservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchDataAutoConfiguration;
import org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchClientAutoConfiguration;
import org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchRestClientAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@SpringBootApplication(
    exclude = {
      ElasticsearchDataAutoConfiguration.class,
      ElasticsearchRestClientAutoConfiguration.class,
      ElasticsearchClientAutoConfiguration.class
    })
@EnableElasticsearchRepositories(basePackages = "com.naodab.productservice.repositories")
@EnableCaching
@ComponentScan({"com.naodab.productservice", "com.naodab.commonservice"})
public class ProductserviceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProductserviceApplication.class, args);
	}

}
