package com.naodab.productservice.opensearch;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.opensearch.client.opensearch._types.query_dsl.Query;

class OpenSearchNativeQueryHelperTest {

  @Test
  void addKeywordSearchMust_blankKeyword_isNoOp() {
    List<Query> must = new ArrayList<>();
    OpenSearchNativeQueryHelper.addKeywordSearchMust(must, "  ", "title");
    OpenSearchNativeQueryHelper.addKeywordSearchMust(must, null, "title");
    assertThat(must).isEmpty();
  }

  @Test
  void addKeywordSearchMust_singleToken_addsOneQuery() {
    List<Query> must = new ArrayList<>();
    OpenSearchNativeQueryHelper.addKeywordSearchMust(must, "sony", "title^3", "name^3");
    assertThat(must).hasSize(1);
    assertThat(must.get(0).isMultiMatch()).isTrue();
  }

  @Test
  void addKeywordSearchMust_multiToken_wrapsCrossFieldsAndPhraseInBool() {
    List<Query> must = new ArrayList<>();
    OpenSearchNativeQueryHelper.addKeywordSearchMust(must, "máy ảnh", "title^3", "name^3");
    assertThat(must).hasSize(1);
    Query root = must.get(0);
    assertThat(root.isBool()).isTrue();
    assertThat(root.bool().must()).hasSize(1);
    assertThat(root.bool().must().get(0).multiMatch().type().jsonValue()).isEqualTo("cross_fields");
    assertThat(root.bool().must().get(0).multiMatch().operator().jsonValue()).isEqualTo("and");
    assertThat(root.bool().should()).hasSize(1);
    assertThat(root.bool().should().get(0).multiMatch().type().jsonValue()).isEqualTo("phrase");
  }

  @Test
  void listingKeywordSearchFields_includesPrimarySubCategoryName() {
    assertThat(OpenSearchNativeQueryHelper.listingKeywordSearchFields())
        .contains("primarySubCategoryName^2");
  }
}
