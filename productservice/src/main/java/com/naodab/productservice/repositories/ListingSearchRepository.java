package com.naodab.productservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.repository.NoRepositoryBean;

import com.naodab.productservice.documents.ListingDocument;

@NoRepositoryBean
public interface ListingSearchRepository extends ElasticsearchRepository<ListingDocument, String> {
}
