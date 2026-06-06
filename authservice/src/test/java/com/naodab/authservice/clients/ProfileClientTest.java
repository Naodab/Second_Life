package com.naodab.authservice.clients;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class ProfileClientTest {

  @Mock
  RestTemplate restTemplate;

  @InjectMocks
  ProfileClient profileClient;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(profileClient, "profileServiceUrl", "http://profile-service:8082/api/v1");
  }

  @Test
  void getProfileById_returnsEmptyForBlankIdWithoutCallingRemote() {
    assertThat(profileClient.getProfileById(null)).isEmpty();
    assertThat(profileClient.getProfileById("")).isEmpty();
    assertThat(profileClient.getProfileById("   ")).isEmpty();
    verifyNoInteractions(restTemplate);
  }
}
