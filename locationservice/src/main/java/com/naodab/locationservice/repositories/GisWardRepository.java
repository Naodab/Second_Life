package com.naodab.locationservice.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.naodab.locationservice.models.GisWard;

public interface GisWardRepository extends JpaRepository<GisWard, Integer> {

	@Query(value = """
			SELECT gw.ward_code FROM gis_wards gw
			WHERE ST_Contains(gw.geom, ST_GeomFromText(CONCAT('POINT(', :lat, ' ', :lon, ')'), 4326))
			""", nativeQuery = true)
	List<String> findWardCodesByLonAndLat(@Param("lon") Float lon, @Param("lat") Float lat);

	@Query(value = """
			SELECT gw.ward_code FROM gis_wards gw
			WHERE ST_Distance_Sphere(
			    ST_GeomFromText(CONCAT('POINT(', :lat, ' ', :lon, ')'), 4326),
			    ST_GeomFromText(CONCAT('POINT(',
			        (ST_XMin(gw.bbox) + ST_XMax(gw.bbox)) / 2, ' ',
			        (ST_YMin(gw.bbox) + ST_YMax(gw.bbox)) / 2
			    , ')'), 4326)
			) <= :radiusMeters
			ORDER BY ST_Distance_Sphere(
			    ST_GeomFromText(CONCAT('POINT(', :lat, ' ', :lon, ')'), 4326),
			    ST_GeomFromText(CONCAT('POINT(',
			        (ST_XMin(gw.bbox) + ST_XMax(gw.bbox)) / 2, ' ',
			        (ST_YMin(gw.bbox) + ST_YMax(gw.bbox)) / 2
			    , ')'), 4326)
			)
			""", nativeQuery = true)
	List<String> findWardCodesWithinRadius(
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
			        ST_GeomFromText(CONCAT('POINT(', :lat, ' ', :lon, ')'), 4326)
			    )
			""", nativeQuery = true)
	long countWardContainingPoint(
			@Param("wardCode") String wardCode,
			@Param("provinceCode") String provinceCode,
			@Param("lon") Float lon,
			@Param("lat") Float lat);
}
