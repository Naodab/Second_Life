import { beforeEach, describe, expect, it } from "vitest";

import {
  buildInitialMessagePayload,
  buildMessagesHref,
  markInitialAttachSent,
  parseMessageDeepLink,
  resolveMessageSearch,
  toOrderCardPayload,
  toProductCardPayload,
  wasInitialAttachSent,
} from "./message-navigation";

describe("message-navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("buildMessagesHref", () => {
    it("builds facility-only link", () => {
      expect(buildMessagesHref({ facilityId: "fac-1" })).toBe("/messages?facilityId=fac-1");
    });

    it("builds seller inbox link", () => {
      expect(buildMessagesHref({ facilityId: "fac-1", tab: "customers" })).toBe(
        "/messages?facilityId=fac-1&tab=customers",
      );
    });

    it("includes product context in query string", () => {
      const href = buildMessagesHref({
        facilityId: "fac-1",
        listingId: "listing-1",
        productTitle: "Máy ảnh vintage",
        listingType: "rent",
        price: 150_000,
      });
      const params = new URL(href, "http://localhost").searchParams;
      expect(params.get("facilityId")).toBe("fac-1");
      expect(params.get("listingId")).toBe("listing-1");
      expect(params.get("productTitle")).toBe("Máy ảnh vintage");
      expect(params.get("listingType")).toBe("rent");
      expect(params.get("price")).toBe("150000");
    });

    it("includes order context in query string", () => {
      const href = buildMessagesHref({
        facilityId: "fac-1",
        orderId: "order-1",
        orderKind: "buy",
        orderStatus: "PENDING",
        orderTitle: "Ghế mây",
        orderAmount: 320_000,
      });
      const params = new URL(href, "http://localhost").searchParams;
      expect(params.get("orderId")).toBe("order-1");
      expect(params.get("orderKind")).toBe("buy");
      expect(params.get("orderStatus")).toBe("PENDING");
      expect(params.get("orderTitle")).toBe("Ghế mây");
      expect(params.get("orderAmount")).toBe("320000");
    });
  });

  describe("parseMessageDeepLink", () => {
    it("returns null when facilityId is missing", () => {
      expect(parseMessageDeepLink("?listingId=l1")).toBeNull();
    });

    it("parses product deep link", () => {
      expect(
        parseMessageDeepLink(
          "?facilityId=fac-1&listingId=l1&productTitle=Camera&listingType=RENT&price=99000",
        ),
      ).toEqual({
        facilityId: "fac-1",
        tab: undefined,
        listingId: "l1",
        listingVariantId: undefined,
        productTitle: "Camera",
        thumbnailUrl: undefined,
        listingType: "RENT",
        price: 99_000,
        orderId: undefined,
        orderKind: undefined,
        orderStatus: undefined,
        orderTitle: undefined,
        orderAmount: undefined,
      });
    });

    it("parses order deep link", () => {
      expect(
        parseMessageDeepLink(
          "?facilityId=fac-1&orderId=o1&orderKind=rent&orderTitle=Tent&orderStatus=CONFIRMED&orderAmount=500000",
        ),
      ).toEqual({
        facilityId: "fac-1",
        tab: undefined,
        listingId: undefined,
        listingVariantId: undefined,
        productTitle: undefined,
        thumbnailUrl: undefined,
        listingType: undefined,
        price: undefined,
        orderId: "o1",
        orderKind: "rent",
        orderStatus: "CONFIRMED",
        orderTitle: "Tent",
        orderAmount: 500_000,
      });
    });

    it("parses seller tab deep link", () => {
      expect(parseMessageDeepLink("?facilityId=fac-1&tab=customers")).toEqual({
        facilityId: "fac-1",
        tab: "customers",
        listingId: undefined,
        listingVariantId: undefined,
        productTitle: undefined,
        thumbnailUrl: undefined,
        listingType: undefined,
        price: undefined,
        orderId: undefined,
        orderKind: undefined,
        orderStatus: undefined,
        orderTitle: undefined,
        orderAmount: undefined,
      });
    });
  });

  describe("buildInitialMessagePayload", () => {
    it("prefers order card when order context is present", () => {
      expect(
        buildInitialMessagePayload({
          facilityId: "fac-1",
          orderId: "o1",
          orderTitle: "Ghế mây",
          orderKind: "buy",
          orderStatus: "PENDING",
        }),
      ).toEqual({
        orderCard: {
          orderId: "o1",
          orderType: "BUY",
          status: "PENDING",
          title: "Ghế mây",
          thumbnailUrl: undefined,
          amount: undefined,
        },
      });
    });

    it("builds product card payload", () => {
      expect(
        buildInitialMessagePayload({
          facilityId: "fac-1",
          listingId: "l1",
          productTitle: "Áo khoác",
          listingType: "buy",
          price: 120_000,
        }),
      ).toEqual({
        productCard: {
          listingId: "l1",
          listingVariantId: undefined,
          title: "Áo khoác",
          thumbnailUrl: undefined,
          listingType: "BUY",
          price: 120_000,
        },
      });
    });

    it("returns null when no attachable context", () => {
      expect(buildInitialMessagePayload({ facilityId: "fac-1" })).toBeNull();
    });
  });

  describe("initial attach dedupe", () => {
    it("tracks product attach only once per session", () => {
      const context = {
        facilityId: "fac-1",
        listingId: "l1",
        productTitle: "Camera",
      };
      expect(wasInitialAttachSent(context)).toBe(false);
      markInitialAttachSent(context);
      expect(wasInitialAttachSent(context)).toBe(true);
    });
  });

  describe("resolveMessageSearch", () => {
    it("falls back to window.location.search when router search is empty", () => {
      const original = window.location.search;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...window.location, search: "?facilityId=fac-1" },
      });
      expect(resolveMessageSearch("")).toBe("?facilityId=fac-1");
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...window.location, search: original },
      });
    });
  });

  describe("payload helpers", () => {
    it("maps product card payload", () => {
      expect(
        toProductCardPayload({
          listingId: "l1",
          title: "Lens",
          listingType: "rent",
          price: 50_000,
        }),
      ).toEqual({
        listingId: "l1",
        listingVariantId: undefined,
        title: "Lens",
        thumbnailUrl: undefined,
        listingType: "RENT",
        price: 50_000,
      });
    });

    it("maps order card payload", () => {
      expect(
        toOrderCardPayload({
          orderId: "o1",
          orderKind: "rent",
          status: "PENDING",
          title: "Lều",
          amount: 200_000,
        }),
      ).toEqual({
        orderId: "o1",
        orderType: "RENT",
        status: "PENDING",
        title: "Lều",
        thumbnailUrl: undefined,
        amount: 200_000,
      });
    });
  });
});
