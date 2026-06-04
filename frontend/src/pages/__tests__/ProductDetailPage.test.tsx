import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import ProductDetailPage from "@/pages/ProductDetailPage";

const { mockSearchProducts } = vi.hoisted(() => ({
  mockSearchProducts: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  searchProducts: mockSearchProducts,
}));

type DetailProduct = {
  id: number | string;
  Name: string;
  Type?: string;
  Genre?: string[];
  Description?: string;
  Release?: string;
  AverageGrade?: number;
  Image?: string;
};

const SAMPLE_PRODUCT: DetailProduct = {
  id: 42,
  Name: "Hollow Knight",
  Type: "game",
  AverageGrade: 92,
  Description: "Un metroidvania atmospheric",
  Release: "2017-02-24",
  Genre: ["action", "adventure"],
  Image: "https://example.com/hk.jpg",
};

function renderWithState(product: DetailProduct) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/product/42", state: { product } }]}>
      <ProductDetailPage />
    </MemoryRouter>
  );
}

function renderByUrl(name: string) {
  return render(
    <MemoryRouter initialEntries={[`/product/${encodeURIComponent(name)}`]}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductDetailPage", () => {
  describe("loading state", () => {
    it("shows loading indicator when loading from API", () => {
      mockSearchProducts.mockReturnValue(new Promise(() => {}));
      renderByUrl("Some Game");
      expect(screen.getByText("Cargando ficha…")).toBeInTheDocument();
    });
  });

  describe("not found state", () => {
    it("shows not found when API returns empty results and no state", async () => {
      mockSearchProducts.mockResolvedValue([]);
      renderByUrl("NonExistent");

      await waitFor(() => {
        expect(screen.getByText("No encontramos este título")).toBeInTheDocument();
      });

      const backLink = screen.getByText("Volver al panel");
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest("a")).toHaveAttribute("href", "/dashboard");
    });

    it("shows not found when API throws an error and no state", async () => {
      mockSearchProducts.mockRejectedValue(new Error("network error"));
      renderByUrl("Unreachable");

      await waitFor(() => {
        expect(screen.getByText("No encontramos este título")).toBeInTheDocument();
      });
    });

    it("recovers from API errors when state product exists", async () => {
      mockSearchProducts.mockRejectedValue(new Error("network error"));
      renderWithState(SAMPLE_PRODUCT);

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRODUCT.Name)).toBeInTheDocument();
      });
    });
  });

  describe("successful render from router state", () => {
    it("renders product name and type label", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      expect(screen.getByText(SAMPLE_PRODUCT.Name)).toBeInTheDocument();
      expect(screen.getAllByText("Videojuego").length).toBe(2);
    });

    it("renders description inside About section", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      expect(screen.getByText("Acerca de")).toBeInTheDocument();
      expect(screen.getByText(SAMPLE_PRODUCT.Description!)).toBeInTheDocument();
    });

    it("renders genre tags", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      for (const g of SAMPLE_PRODUCT.Genre!) {
        expect(screen.getByText(g)).toBeInTheDocument();
      }
    });

    it("renders release date formatted", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      expect(screen.getByText("24 feb 2017")).toBeInTheDocument();
    });

    it("renders average grade", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      expect(screen.getByText(`${SAMPLE_PRODUCT.AverageGrade}/100`)).toBeInTheDocument();
    });

    it("hides average grade when value is 0", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState({ ...SAMPLE_PRODUCT, AverageGrade: 0 });
      expect(screen.queryByText("Nota media")).not.toBeInTheDocument();
    });

    it("does not render genre section when genres are empty", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState({ ...SAMPLE_PRODUCT, Genre: [] });
      expect(screen.queryByText("action")).not.toBeInTheDocument();
    });

    it("renders product image when available", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      const img = document.querySelector("img") as HTMLImageElement | null;
      expect(img).not.toBeNull();
      expect(img!.src).toBe(SAMPLE_PRODUCT.Image);
    });

    it("does not render img when product has no image", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState({ ...SAMPLE_PRODUCT, Image: undefined });
      expect(document.querySelector("img")).toBeNull();
    });
  });

  describe("successful render from API fetch", () => {
    it("fetches product by name and renders it", async () => {
      mockSearchProducts.mockResolvedValue([SAMPLE_PRODUCT]);
      renderByUrl("Hollow Knight");

      await waitFor(() => {
        expect(mockSearchProducts).toHaveBeenCalledWith("Hollow Knight", expect.any(AbortSignal));
      });

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRODUCT.Name)).toBeInTheDocument();
      });
    });

    it("picks the matching product when API returns multiple", async () => {
      mockSearchProducts.mockResolvedValue([
        { ...SAMPLE_PRODUCT, id: 1, Name: "Other Game" },
        SAMPLE_PRODUCT,
      ]);
      renderByUrl("Hollow Knight");

      await waitFor(() => {
        expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
      });
    });

    it("shows not found on AbortError when no state product", async () => {
      const abortError = new DOMException("aborted", "AbortError");
      mockSearchProducts.mockRejectedValue(abortError);
      renderByUrl("Cancelled");

      await waitFor(() => {
        expect(screen.getByText("No encontramos este título")).toBeInTheDocument();
      });
    });

    it("recovers from AbortError when state product exists", async () => {
      const abortError = new DOMException("aborted", "AbortError");
      mockSearchProducts.mockRejectedValue(abortError);
      renderWithState(SAMPLE_PRODUCT);

      await waitFor(() => {
        expect(screen.getByText(SAMPLE_PRODUCT.Name)).toBeInTheDocument();
      });
    });
  });

  describe("community reviews section", () => {
    it("renders the community reviews header", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      expect(screen.getByText("La comunidad opina")).toBeInTheDocument();
    });

    it("shows review verdicts", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      const yesChips = screen.getAllByText("Sí");
      const noChips = screen.getAllByText("No");
      expect(yesChips.length).toBeGreaterThan(0);
      expect(noChips.length).toBeGreaterThan(0);
    });
  });

  describe("navigation links", () => {
    it("renders back link to dashboard", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      const back = screen.getByText("Volver al catálogo");
      expect(back.closest("a")).toHaveAttribute("href", "/dashboard");
    });

    it("renders publish review link with product state", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState(SAMPLE_PRODUCT);
      const publish = screen.getByText("Publica tu veredicto");
      expect(publish.closest("a")).toHaveAttribute("href", "/publish-review");
    });
  });

  describe("fallback description", () => {
    it("shows fallback text when description is empty", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState({ ...SAMPLE_PRODUCT, Description: "" });
      expect(
        screen.getByText("Todavía no hay una descripción para este título en el catálogo.")
      ).toBeInTheDocument();
    });

    it("shows fallback text when description is whitespace", () => {
      mockSearchProducts.mockRejectedValue(new Error("should not be called"));
      renderWithState({ ...SAMPLE_PRODUCT, Description: "   " });
      expect(
        screen.getByText("Todavía no hay una descripción para este título en el catálogo.")
      ).toBeInTheDocument();
    });
  });
});
