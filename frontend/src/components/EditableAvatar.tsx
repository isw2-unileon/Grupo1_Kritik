import { useState, useRef, useEffect, useCallback } from "react";
import UserAvatar from "@/components/UserAvatar";
import { uploadAvatar, deleteAvatar } from "@/services/api";

interface Props {
  image?: string | null;
  name: string;
  onUpdate: (url: string) => void;
}

export default function EditableAvatar({ image, name, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = uploading || deleting;

  const handleClose = useCallback(() => {
    setOpen(false);
    setFile(null);
    setPreview(null);
    setDeleting(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  const handleFileSelect = useCallback((f: File) => {
    setError(null);
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
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(file);
      onUpdate(url);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }, [file, onUpdate, handleClose]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAvatar();
      onUpdate("");
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al borrar la imagen");
    } finally {
      setDeleting(false);
    }
  }, [onUpdate, handleClose]);

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <UserAvatar image={image} name={name} size="lg" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-faint transition hover:text-cream"
        >
          ✎ Editar
        </button>
      </div>

      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar foto de perfil"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
        >
          <div className="w-full max-w-sm rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-cream">
                Cambiar foto de perfil
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

            <div className="mt-5">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleInputChange}
              />

              {!preview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-ink/30 p-8 text-center transition hover:border-acid/50 hover:bg-ink/50"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-faint">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm text-faint">
                    Arrastra una imagen aquí<br />o haz clic para seleccionar
                  </p>
                  <span className="text-xs text-dim">JPG, PNG, WebP o GIF (máx. 5 MB)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="h-32 w-32 rounded-full object-cover ring-2 ring-line"
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-medium text-faint transition hover:text-cream"
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="flex-1 rounded-xl border border-line bg-ink py-2.5 text-sm font-medium text-dim transition hover:bg-surface2 hover:text-cream disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || busy}
                className="flex-1 rounded-xl bg-acid py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {uploading ? "Subiendo…" : "Guardar"}
              </button>
            </div>

            {image && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="text-xs text-faint transition hover:text-coral disabled:opacity-50"
                >
                  {deleting ? "Borrando…" : "Borrar foto actual"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
