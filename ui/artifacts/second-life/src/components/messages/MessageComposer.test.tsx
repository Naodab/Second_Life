import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageComposer } from "./MessageComposer";

vi.mock("@/lib/cloudinary", () => ({
  uploadImageToCloudinary: vi.fn(async (file: File) => `https://res.cloudinary.com/demo/${file.name}`),
}));

describe("MessageComposer", () => {
  it("sends text message on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(async () => undefined);
    render(<MessageComposer onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Nhập tin nhắn..."), "Xin chào shop{Enter}");

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith({ content: "Xin chào shop" });
    });
  });

  it("keeps send disabled when empty", () => {
    render(<MessageComposer onSend={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons[buttons.length - 1];
    expect(sendButton).toBeDisabled();
  });

  it("uploads image and sends imageUrls payload", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(async () => undefined);
    render(<MessageComposer onSend={onSend} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByAltText("")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith({
        imageUrls: ["https://res.cloudinary.com/demo/photo.jpg"],
      });
    });
  });

  it("removes pending image before send", async () => {
    const user = userEvent.setup();
    render(<MessageComposer onSend={vi.fn(async () => undefined)} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(["img"], "photo.jpg", { type: "image/jpeg" }));

    await waitFor(() => {
      expect(screen.getByAltText("")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Xóa ảnh" }));
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  it("does not send when disabled", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageComposer disabled onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Nhập tin nhắn..."), "Hello{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });
});
