package com.naodab.productservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.event.UpdateMainImageFacilityEvent;
import com.naodab.productservice.services.FacilityService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UpdateMainImageFacilityConsumer {
  FacilityService facilityService;

  @KafkaListener(topics = "${spring.kafka.topics.update-main-image-facility}", containerFactory = "updateMainImageFacilityKafkaListenerContainerFactory")
  public void consume(UpdateMainImageFacilityEvent event) {
    log.info("Consuming update main image facility event: {}", event);
    facilityService.updateMainImageFacility(event.getFacilityId(), event.getImageUrl());
  }
}
