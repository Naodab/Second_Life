package com.naodab.productservice.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.documents.ProductDocument;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ElasticsearchIndexEnsurer implements ApplicationListener<ApplicationReadyEvent> {

  private final ElasticsearchOperations elasticsearchOperations;

  @Override
  public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
    ensureIndex(ProductDocument.class);
    ensureIndex(ListingDocument.class);
  }

  private void ensureIndex(Class<?> documentClass) {
    try {
      var indexOps = elasticsearchOperations.indexOps(documentClass);
      if (indexOps.exists()) {
        log.debug("Elasticsearch index already exists for {}", documentClass.getSimpleName());
        return;
      }
      indexOps.createWithMapping();
      log.info("Created Elasticsearch index with explicit mapping for {}", documentClass.getSimpleName());
    } catch (RuntimeException e) {
      log.error("Could not ensure Elasticsearch index for {}", documentClass.getSimpleName(), e);
    }
  }
}
