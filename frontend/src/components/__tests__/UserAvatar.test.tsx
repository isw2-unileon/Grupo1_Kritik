import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import UserAvatar from "../UserAvatar";

afterEach(cleanup);

describe("UserAvatar", () => {
  it("renders initial letter when no image is provided", () => {
    render(<UserAvatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders question mark when name is empty", () => {
    render(<UserAvatar name="" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders img when image is provided", () => {
    render(<UserAvatar name="Bob" image="https://example.com/avatar.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(img).toHaveAttribute("alt", "Bob");
  });

  it("renders initial when image fails to load", () => {
    render(<UserAvatar name="Carol" image="https://example.com/broken.jpg" />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("renders initial for null image", () => {
    render(<UserAvatar name="Dave" image={null} />);
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { container } = render(<UserAvatar name="Eve" size="lg" />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("h-16");
    expect(span).toHaveClass("w-16");
  });

  it("defaults to md size", () => {
    const { container } = render(<UserAvatar name="Frank" />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("h-12");
    expect(span).toHaveClass("w-12");
  });
});
