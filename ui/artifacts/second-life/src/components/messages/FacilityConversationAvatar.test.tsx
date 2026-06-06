import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { FacilityConversationAvatar } from "./FacilityConversationAvatar";
import { DEFAULT_FACILITY_AVATAR } from "@/api/facility";

describe("FacilityConversationAvatar", () => {
  it("renders facility image when imageUrl is provided", () => {
    render(
      <FacilityConversationAvatar
        imageUrl="https://res.cloudinary.com/demo/facility.jpg"
        name="Green Loop Store"
        className="h-12 w-12"
      />,
    );

    const img = screen.getByRole("img", { name: "Green Loop Store" });
    expect(img).toHaveAttribute("src", "https://res.cloudinary.com/demo/facility.jpg");
  });

  it("falls back to default facility avatar when imageUrl is missing", () => {
    render(<FacilityConversationAvatar name="Green Loop Store" className="h-12 w-12" />);

    const img = screen.getByRole("img", { name: "Green Loop Store" });
    expect(img).toHaveAttribute("src", DEFAULT_FACILITY_AVATAR);
  });
});
