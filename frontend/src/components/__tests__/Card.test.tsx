import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Card from "../Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders children", () => {
    render(<Card><p data-testid="child">content</p></Card>);
    expect(screen.getByTestId("child")).toHaveTextContent("content");
  });

  it("renders as div by default", () => {
    const { container } = render(<Card>text</Card>);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("renders with custom tag", () => {
    const { container } = render(<Card as="section">text</Card>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="p-10">text</Card>);
    expect(container.firstChild).toHaveClass("p-10");
  });

  it("sets id attribute", () => {
    render(<Card id="test-id">text</Card>);
    expect(screen.getByText("text")).toHaveAttribute("id", "test-id");
  });
});
