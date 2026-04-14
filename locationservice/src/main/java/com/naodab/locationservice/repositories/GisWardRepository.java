package com.naodab.locationservice.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.locationservice.models.GisWard;

public interface GisWardRepository extends JpaRepository<GisWard, Integer> {

	@Query(value = """
			SELECT * FROM gis_wards
			WHERE ST_Contains(geom, ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326))
			ORDER BY ST_Distance_Sphere(ST_Centroid(geom), ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326))
			""", nativeQuery = true)
	List<GisWard> findByLonAndLat(@Param("lon") Float lon, @Param("lat") Float lat);

	@Query(value = """
			SELECT * FROM gis_wards
			WHERE ST_Distance_Sphere(
			    ST_Centroid(geom),
			    ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326)
			) <= :radiusMeters
			ORDER BY ST_Distance_Sphere(ST_Centroid(geom), ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326))
			""", nativeQuery = true)
	List<GisWard> findWithinRadius(
			@Param("lon") Float lon,
			@Param("lat") Float lat,
			@Param("radiusMeters") Float radiusMeters);

	@Query(value = """
			SELECT COUNT(*)
			FROM gis_wards gw
			INNER JOIN wards w ON w.code = gw.ward_code
			WHERE w.code = :wardCode
			    AND w.province_code = :provinceCode
			    AND ST_Contains(
			        gw.geom,
			        ST_GeomFromText(CONCAT('POINT(', :lon, ' ', :lat, ')'), 4326)
			    )
			""", nativeQuery = true)
	long countWardContainingPoint(
			@Param("wardCode") String wardCode,
			@Param("provinceCode") String provinceCode,
			@Param("lon") Float lon,
			@Param("lat") Float lat);
}
