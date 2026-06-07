import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import type { ProfileUser } from "@/services/api";

interface Props {
  users: ProfileUser[];
  unfollowingIds: Set<number>;
  error: string | null;
  onClose: () => void;
  onUnfollow: (id: number) => Promise<void>;
}

export default function FollowingList({
  users,
  unfollowingIds,
  error,
  onClose,
  onUnfollow,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Usuarios que sigues"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-cream">Siguiendo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
        )}

        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">
          {users.length === 0 ? (
            <p className="py-8 text-center text-dim">No sigues a nadie todavía.</p>
          ) : (
            users.map((u) => {
              const loading = unfollowingIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink/40"
                >
                  <Link
                    to={`/user/${u.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UserAvatar image={u.Image} name={u.Name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cream">{u.Name}</p>
                      <p className="truncate text-xs text-faint">@{u.UserName}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onUnfollow(u.id)}
                    className="shrink-0 rounded-full border border-coral px-3.5 py-1.5 text-xs font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-40"
                  >
                    {loading ? "Dejando de seguir…" : "Dejar de seguir"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
