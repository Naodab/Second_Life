package com.naodab.productservice.services.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.naodab.productservice.client.InventoryAdminClient;
import com.naodab.productservice.client.dto.InventoryPurgeStatsDto;
import com.naodab.productservice.dto.response.AdminListingPurgeResponse;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.services.ListingAdminPurgeService;
import com.naodab.productservice.services.ListingSearchService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingAdminPurgeServiceImpl implements ListingAdminPurgeService {

  InventoryAdminClient inventoryAdminClient;
  ListingSearchService listingSearchService;
  ListingVariantRepository listingVariantRepository;
  ListingRepository listingRepository;
  ListingDatabasePurgeTxHelper listingDatabasePurgeTxHelper;

  @Override
  public AdminListingPurgeResponse purgeAllListingsAndSearchIndexAndRemoteInventory(String adminJwtRoleHeader) {
    Optional<InventoryPurgeStatsDto> inv =
        inventoryAdminClient.purgeAllListingLinkedInventoryIfConfigured(adminJwtRoleHeader);
    inv.ifPresent(
        stats ->
            log.warn(
                "Admin purge: inventory removed reservations={}, items={}",
                stats.reservationsRemoved(),
                stats.inventoryItemsRemoved()));
    if (inv.isEmpty() && !inventoryAdminClient.isConfigured()) {
      log.warn("Admin purge: external.inventory-service.url is blank; skipping inventoryservice purge");
    }

    long listingRows = listingRepository.count();
    long variantRows = listingVariantRepository.count();
    long esRemoved = listingSearchService.removeAllListingDocumentsFromIndex();
    listingDatabasePurgeTxHelper.deleteAllVariantsThenListings();

    return AdminListingPurgeResponse.builder()
        .listingRowsRemoved(listingRows)
        .listingVariantRowsRemoved(variantRows)
        .listingSearchDocumentsRemoved(esRemoved)
        .inventoryReservationsRemoved(inv.map(InventoryPurgeStatsDto::reservationsRemoved).orElse(null))
        .inventoryItemsRemoved(inv.map(InventoryPurgeStatsDto::inventoryItemsRemoved).orElse(null))
        .inventoryServiceInvoked(inventoryAdminClient.isConfigured())
        .build();
  }
}
