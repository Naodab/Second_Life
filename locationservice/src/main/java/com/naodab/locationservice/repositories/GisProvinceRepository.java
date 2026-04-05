package com.naodab.locationservice.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.locationservice.models.GisProvince;

public interface GisProvinceRepository extends JpaRepository<GisProvince, Integer> {

  @Query(value = """
      SELECT * FROM gis_provinces
      WHERE ST_Contains(geom, ST_GeomFromText('POINT(:lon :lat)', 4326))
      ORDER BY ST_Distance_Sphere(ST_Centroid(geom), ST_GeomFromText('POINT(:lon :lat)', 4326))
      """, nativeQuery = true)
  List<GisProvince> findByLonAndLat(@Param("lon") Float lon, @Param("lat") Float lat);

  @Query(value = """
      SELECT * FROM gis_provinces
      WHERE ST_Distance_Sphere(
          ST_Centroid(geom),
          ST_GeomFromText('POINT(:lon :lat)', 4326)
      ) <= :radiusMeters
      ORDER BY ST_Distance_Sphere(ST_Centroid(geom), ST_GeomFromText('POINT(:lon :lat)', 4326))
      """, nativeQuery = true)
  List<GisProvince> findWithinRadius(
      @Param("lat") Float lat,
      @Param("lon") Float lon,
      @Param("radiusMeters") Float radiusMeters);
}
