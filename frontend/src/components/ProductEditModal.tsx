import { useState, useRef, useEffect, useCallback } from "react";
import {
  updateProduct,
  uploadProductImage,
  type Product,
  type ProductFormData,
} from "@/services/api";

interface Props {
  product: Product;
  onSave: () => void;
  onClose: () => void;
}

export default function ProductEditModal({ product, onSave, onClose }: Props) {
  const [name, setName] = useState(product.Name);
  const [type, setType] = useState(product.Type ?? "");
  const [description, setDescription] = useState(product.Description ?? "");
  const [release, setRelease] = useState(product.Release ?? "");
  const [genreStr, setGenreStr] = useState((product.Genre ?? []).join(", "));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  const handleImageSelect = useCallback((f: File) => {
    const maxSize = 5 * 1024 * 1024;
    if (f.size > maxSize) {
      setError("La imagen no puede superar los 5 MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(f.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o GIF");
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const genres = genreStr
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const data: ProductFormData = {
        Name: name.trim(),
        Type: type.trim() || undefined,
        Description: description.trim() || undefined,
        Release: release || undefined,
        Genre: genres.length > 0 ? genres : undefined,
      };

      await updateProduct(product.id, data);

      if (imageFile) {
        await uploadProductImage(product.id, imageFile);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [name, type, description, release, genreStr, imageFile, product.id, onSave]);

  const currentImage = imagePreview ?? product.Image;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Modificar producto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-line bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-cream">
            Modificar producto
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cream">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream">Tipo</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Videojuego, Libro, Serie, Película…"
              className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream">Fecha de lanzamiento</label>
            <input
              type="date"
              value={release}
              onChange={(e) => setRelease(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream">Géneros (separados por coma)</label>
            <input
              type="text"
              value={genreStr}
              onChange={(e) => setGenreStr(e.target.value)}
              placeholder="Acción, Aventura, Drama…"
              className="mt-1 w-full rounded-xl border border-line bg-ink px-4 py-2.5 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cream">Imagen</label>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageSelect(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 w-full rounded-xl border border-dashed border-line bg-ink/40 px-4 py-3 text-sm text-faint transition hover:border-acid/50 hover:text-cream"
            >
              {currentImage ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
            {currentImage && (
              <img
                src={currentImage}
                alt="Vista previa"
                className="mt-2 h-24 w-24 rounded-xl object-cover ring-1 ring-line"
              />
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-line bg-ink py-2.5 text-sm font-medium text-dim transition hover:bg-surface2 hover:text-cream disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-acid py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
