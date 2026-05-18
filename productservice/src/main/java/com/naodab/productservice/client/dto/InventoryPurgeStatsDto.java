package com.naodab.productservice.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InventoryPurgeStatsDto(long reservationsRemoved, long inventoryItemsRemoved) {
}
