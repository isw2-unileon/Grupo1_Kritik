import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";

const { mockUploadAvatar, mockDeleteAvatar } = vi.hoisted(() => ({
  mockUploadAvatar: vi.fn(),
  mockDeleteAvatar: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  uploadAvatar: mockUploadAvatar,
  deleteAvatar: mockDeleteAvatar,
}));

import EditableAvatar from "@/components/EditableAvatar";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EditableAvatar", () => {
  const onUpdate = vi.fn();

  it("renders the avatar and edit button", () => {
    render(<EditableAvatar image={null} name="Test User" onUpdate={onUpdate} />);
    expect(screen.getByText("T")).toBeInTheDocument();
    expect(screen.getByText("✎ Editar")).toBeInTheDocument();
  });

  it("shows the avatar image when provided", () => {
    render(<EditableAvatar image="https://example.com/avatar.jpg" name="Test" onUpdate={onUpdate} />);
    expect(screen.getByAltText("Test")).toBeInTheDocument();
  });

  it("opens a dialog when clicking Editar", async () => {
    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));
    expect(screen.getByRole("dialog", { name: "Cambiar foto de perfil" })).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Guardar")).toBeInTheDocument();
  });

  it("closes dialog on Cancelar click", async () => {
    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByText("Cancelar"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows validation error for oversized file", async () => {
    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));

    const file = new File(["x".repeat(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Cambiar foto de perfil").querySelector("input[type=file]")!;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/La imagen no puede superar los 5 MB/)).toBeInTheDocument();
    });
  });

  it("calls uploadAvatar and onUpdate on successful upload", async () => {
    mockUploadAvatar.mockResolvedValue("https://example.com/new.jpg");
    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Cambiar foto de perfil").querySelector("input[type=file]")!;
    await user.upload(input, file);

    await user.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith(file);
    });
    expect(onUpdate).toHaveBeenCalledWith("https://example.com/new.jpg");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows error message when upload fails", async () => {
    mockUploadAvatar.mockRejectedValue(new Error("upload error"));
    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("Cambiar foto de perfil").querySelector("input[type=file]")!;
    await user.upload(input, file);

    await user.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(screen.getByText("upload error")).toBeInTheDocument();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("shows Borrar foto actual button only when image is provided", async () => {
    const { unmount } = render(<EditableAvatar image="https://example.com/avatar.jpg" name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));
    expect(screen.getByText("Borrar foto actual")).toBeInTheDocument();
    unmount();

    render(<EditableAvatar image={null} name="Test" onUpdate={onUpdate} />);
    await user.click(screen.getByText("✎ Editar"));
    expect(screen.queryByText("Borrar foto actual")).not.toBeInTheDocument();
  });

  it("calls deleteAvatar and onUpdate on successful delete", async () => {
    mockDeleteAvatar.mockResolvedValue("");
    render(<EditableAvatar image="https://example.com/avatar.jpg" name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));

    await user.click(screen.getByText("Borrar foto actual"));

    await waitFor(() => {
      expect(mockDeleteAvatar).toHaveBeenCalled();
    });
    expect(onUpdate).toHaveBeenCalledWith("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows error message when delete fails", async () => {
    mockDeleteAvatar.mockRejectedValue(new Error("delete error"));
    render(<EditableAvatar image="https://example.com/avatar.jpg" name="Test" onUpdate={onUpdate} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("✎ Editar"));

    await user.click(screen.getByText("Borrar foto actual"));

    await waitFor(() => {
      expect(screen.getByText("delete error")).toBeInTheDocument();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
