package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.productservice.models.Facility;

public interface FacilityRepository extends JpaRepository<Facility, String>, JpaSpecificationExecutor<Facility> {

  Optional<Facility> findByIdAndDeletedAtIsNull(String id);

  List<Facility> findAllByDeletedAtIsNull(Sort sort);

  Page<Facility> findAllByDeletedAtIsNull(Pageable pageable);

  boolean existsByOwnerIdAndNameAndDeletedAtIsNull(String ownerId, String name);

  boolean existsByOwnerIdAndNameAndIdNotAndDeletedAtIsNull(String ownerId, String name, String id);

  Optional<Facility> findByIdAndOwnerIdAndDeletedAtIsNull(String id, String ownerId);

  @Query(value = """
      WITH d AS (
        SELECT f.*,
          ST_Distance_Sphere(
            ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326),
            ST_GeomFromText(CONCAT('POINT(', f.longitude, ' ', f.latitude, ')'), 4326)
          ) AS dist_m
        FROM facilities f
      )
      SELECT id, name, owner_id, description, image_url, link_google_map, address,
             province_code, ward_code, latitude, longitude, view_count, order_count, average_rating,
             created_at, updated_at, deleted_at
      FROM d
      WHERE dist_m <= :radiusMeters
      ORDER BY dist_m ASC
      """, nativeQuery = true)
  List<Facility> findByLonAndLat(@Param("lon") Float lon, @Param("lat") Float lat,
      @Param("radiusMeters") Float radiusMeters);

  boolean existsByIdAndDeletedAtIsNull(String facilityId);

  Optional<Facility> findByOwnerIdAndIdAndDeletedAtIsNull(String ownerId, String id);
}
