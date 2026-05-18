package com.naodab.inventoryservice.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.dto.event.InventoryItemCreateRequestEvent;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.mapper.InventoryItemMapper;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.services.InventoryItemService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryItemServiceImpl implements InventoryItemService {
  InventoryItemRepository inventoryItemRepository;
  InventoryItemMapper inventoryItemMapper;

  @Override
  public void createInventoryItem(InventoryItemCreateRequestEvent request) {
    if (request == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    if (inventoryItemRepository.existsByListingVariantIdAndMode(request.getListingVariantId(), request.getMode())) {
      throw new AppException(ErrorCode.INVENTORY_ITEM_ALREADY_EXISTS);
    }

    InventoryItem inventoryItem = inventoryItemMapper.toInventoryItem(request);
    inventoryItemRepository.save(inventoryItem);
  }

  @Override
  @Transactional
  public void createInventoryItemsBatch(List<InventoryItemCreateRequestEvent> items) {
    if (items == null || items.isEmpty()) {
      return;
    }
    for (InventoryItemCreateRequestEvent line : items) {
      if (line == null || line.getListingVariantId() == null || line.getListingVariantId().isBlank()
          || line.getMode() == null
          || inventoryItemRepository.existsByListingVariantIdAndMode(line.getListingVariantId(), line.getMode())) {
        continue;
      }
      inventoryItemRepository.save(inventoryItemMapper.toInventoryItem(line));
    }
  }

  @Override
  public void deleteInventoryItem(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    inventoryItemRepository.deleteById(id);
  }

}
