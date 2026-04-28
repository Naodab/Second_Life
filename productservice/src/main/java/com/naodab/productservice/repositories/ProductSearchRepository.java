package com.naodab.productservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.repository.NoRepositoryBean;

import com.naodab.productservice.documents.ProductDocument;

@NoRepositoryBean
public interface ProductSearchRepository extends ElasticsearchRepository<ProductDocument, String> {
}
