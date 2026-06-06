package com.naodab.mailservice.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FacilitySummary {
  String id;
  String name;
  String ownerId;
  String imageUrl;
}
