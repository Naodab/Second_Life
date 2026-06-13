package com.naodab.locationservice.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

class CoordinateNormalizerTest {

  @Test
  void normalize_vnCoordinates_unchanged() {
    CoordinateNormalizer.LonLat out = CoordinateNormalizer.normalize(105.8156951f, 21.0144345f);
    assertThat(out.longitude()).isEqualTo(105.8156951f);
    assertThat(out.latitude()).isEqualTo(21.0144345f);
  }

  @Test
  void normalize_swappedVnCoordinates_fixesOrder() {
    CoordinateNormalizer.LonLat out = CoordinateNormalizer.normalize(16.0604335f, 108.2453395f);
    assertThat(out.longitude()).isEqualTo(108.2453395f);
    assertThat(out.latitude()).isEqualTo(16.0604335f);
  }

  @Test
  void fromHttpParams_swappedQueryParams_fixesOrder() {
    CoordinateNormalizer.LonLat out = CoordinateNormalizer.fromHttpParams(108.2453395f, 16.0604335f);
    assertThat(out.longitude()).isEqualTo(108.2453395f);
    assertThat(out.latitude()).isEqualTo(16.0604335f);
  }

  @Test
  void normalize_ambiguousVnCoordsAfterSwapStillInvalid_throwsInvalidInput() {
    assertThatThrownBy(() -> CoordinateNormalizer.normalize(105f, 108f))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }
}
