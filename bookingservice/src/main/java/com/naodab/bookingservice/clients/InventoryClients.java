package com.naodab.bookingservice.clients;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.bookingservice.clients.dto.ListingVariantAvailabilityDto;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryClients {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.inventory-service.url}")
  String inventoryServiceUrl;

  public Long getBuyInventoryCount(String listingVariantId) {
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri = UriComponentsBuilder.fromUriString(
        base + "/listing-variants/{listingVariantId}/availability")
        .queryParam("mode", "BUY")
        .buildAndExpand(listingVariantId.trim())
        .toUriString();
    return availabilityAtUri(uri, "availability");
  }

  public void createBuyReservation(InventoryReservationCreateEvent event) {
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri = base + "/reservations/buy";
    try {
      ResponseEntity<ApiResponse<Void>> response =
          restTemplate.exchange(
              Objects.requireNonNull(uri),
              Objects.requireNonNull(HttpMethod.POST),
              new HttpEntity<>(event),
              new ParameterizedTypeReference<ApiResponse<Void>>() {});
      if (response.getStatusCode() != HttpStatus.OK) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
    } catch (HttpClientErrorException.Conflict e) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    } catch (HttpClientErrorException.BadRequest e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.INVENTORY_ITEM_NOT_FOUND);
    } catch (RestClientException e) {
      log.error("Inventory create BUY reservation call failed: {}", e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  public void createRentReservation(InventoryReservationCreateEvent event) {
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri = base + "/reservations/rent";
    try {
      ResponseEntity<ApiResponse<Void>> response =
          restTemplate.exchange(
              Objects.requireNonNull(uri),
              Objects.requireNonNull(HttpMethod.POST),
              new HttpEntity<>(event),
              new ParameterizedTypeReference<ApiResponse<Void>>() {});
      if (response.getStatusCode() != HttpStatus.OK) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
    } catch (HttpClientErrorException.Conflict e) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    } catch (HttpClientErrorException.BadRequest e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.INVENTORY_ITEM_NOT_FOUND);
    } catch (RestClientException e) {
      log.error("Inventory create RENT reservation call failed: {}", e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  public void releaseBuyReservation(String reservationId) {
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri = base + "/reservations/{reservationId}";
    try {
      restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.DELETE),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<Void>>() {},
          reservationId);
    } catch (RestClientException e) {
      log.warn("Inventory release reservation {} failed: {}", reservationId, e.getMessage());
    }
  }

  public Long getRentInventoryCount(
      String listingVariantId, LocalDateTime from, LocalDateTime to) {
    String base = stripTrailingSlashes(inventoryServiceUrl.trim());
    String uri = UriComponentsBuilder.fromUriString(
        base + "/listing-variants/{listingVariantId}/availability-in-range")
        .queryParam("from", from.toInstant(ZoneOffset.UTC).toString())
        .queryParam("to", to.toInstant(ZoneOffset.UTC).toString())
        .queryParam("mode", "RENT")
        .buildAndExpand(listingVariantId.trim())
        .toUriString();
    return availabilityAtUri(uri, "availability-in-range");
  }

  private Long availabilityAtUri(String uri, String operation) {
    try {
      ResponseEntity<ApiResponse<ListingVariantAvailabilityDto>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<ListingVariantAvailabilityDto>>() {
          });
      ApiResponse<ListingVariantAvailabilityDto> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      ListingVariantAvailabilityDto data = body.getData();
      if (!data.isTracked()) {
        return null;
      }
      return data.getAvailableQuantity();
    } catch (RestClientException e) {
      log.error("Inventory {} call failed: {}", operation, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private static String stripTrailingSlashes(String url) {
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }
}
