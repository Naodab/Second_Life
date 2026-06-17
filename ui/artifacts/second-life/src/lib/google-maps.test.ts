import { describe, expect, it } from "vitest";

import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsOpenUrl,
  facilityHasMap,
} from "./google-maps";

describe("google-maps helpers", () => {
  it("prioritizes q= from linkGoogleMap over coarse province lat/lng", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "https://maps.google.com/?q=15+Nguyen+Trai,+Thanh+Xuan,+Hanoi",
      latitude: 21.03,
      longitude: 105.85,
      address: "15 Nguyen Trai",
    });
    expect(url).toContain("q=15+Nguyen+Trai");
    expect(url).toContain("z=17");
    expect(url).toContain("output=embed");
    expect(url).toContain("ll=21.03%2C105.85");
  });

  it("prefers coordinates parsed from link over swapped stored lat/lng", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "https://www.google.com/maps/place/Ho+Chi+Minh/@10.762622,106.660172,17z",
      latitude: 106.660172,
      longitude: 10.762622,
      address: "",
    });
    expect(url).toContain("q=10.762622%2C106.660172");
    expect(url).toContain("ll=10.762622%2C106.660172");
  });

  it("builds embed URL from latitude and longitude when no address query", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "",
      latitude: 21.0285,
      longitude: 105.8542,
      address: "",
    });
    expect(url).toContain("q=21.0285%2C105.8542");
    expect(url).toContain("ll=21.0285%2C105.8542");
  });

  it("uses full search address when link has no q=", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "",
      latitude: null,
      longitude: null,
      address: "88 Ly Tu Trong",
      searchAddress: "88 Ly Tu Trong, Quan 1, Ho Chi Minh",
    });
    expect(url).toContain("q=88+Ly+Tu+Trong");
  });

  it("builds embed URL from @coordinates in link", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "https://www.google.com/maps/place/Hanoi/@21.0285,105.8542,17z",
      latitude: null,
      longitude: null,
      address: "",
    });
    expect(url).toContain("q=21.0285%2C105.8542");
  });

  it("does not embed invalid 0,0 coordinates", () => {
    const url = buildGoogleMapsEmbedUrl({
      linkGoogleMap: "",
      latitude: 0,
      longitude: 0,
      address: "",
    });
    expect(url).toBeNull();
  });

  it("returns open URL from stored linkGoogleMap", () => {
    const openUrl = buildGoogleMapsOpenUrl({
      linkGoogleMap: "https://maps.google.com/?q=Da+Nang",
      latitude: null,
      longitude: null,
      address: "",
    });
    expect(openUrl).toBe("https://maps.google.com/?q=Da+Nang");
  });

  it("detects when facility has mappable data", () => {
    expect(
      facilityHasMap({
        linkGoogleMap: "https://maps.google.com/?q=Hanoi",
        latitude: null,
        longitude: null,
        address: "",
      }),
    ).toBe(true);
    expect(
      facilityHasMap({
        linkGoogleMap: "",
        latitude: null,
        longitude: null,
        address: "",
      }),
    ).toBe(false);
  });
});
