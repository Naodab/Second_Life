package com.naodab.productservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import com.naodab.productservice.documents.ListingDocument;

public interface ListingSearchRepository extends ElasticsearchRepository<ListingDocument, String> {

}
