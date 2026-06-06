import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/Card";
import { createProduct, uploadProductImage } from "@/services/api";

export default function PublishProductPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [release, setRelease] = useState("");
  const [genreStr, setGenreStr] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const product = await createProduct({
        Name: name.trim(),
        Type: type.trim() || undefined,
        Description: description.trim() || undefined,
        Release: release || undefined,
        Genre: genres.length > 0 ? genres : undefined,
      });

      if (imageFile) {
        await uploadProductImage(product.id, imageFile);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card as="form" onSubmit={handleSubmit} className="p-7 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Catálogo</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Publicar producto</h1>

        <div className="mt-6 space-y-4">
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
              {imagePreview ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
            {imagePreview && (
              <img
                src={imagePreview}
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
            onClick={() => navigate(-1)}
            disabled={saving}
            className="flex-1 rounded-xl border border-line bg-ink py-2.5 text-sm font-medium text-dim transition hover:bg-surface2 hover:text-cream disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-acid py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </Card>
    </div>
  );
}
