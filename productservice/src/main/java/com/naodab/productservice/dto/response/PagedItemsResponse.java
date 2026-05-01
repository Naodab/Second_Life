package com.naodab.productservice.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PagedItemsResponse<T> {
  int page;

  int pageSize;
  long totalCount;
  List<T> items;

  public int computedTotalPages() {
    int size = Math.max(pageSize, 1);
    long denom = Math.max(totalCount, 0L);
    return (int) Math.max(1, (denom + size - 1) / size);
  }
}
