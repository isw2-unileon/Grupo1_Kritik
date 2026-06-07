import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/Card";
import EditableAvatar from "@/components/EditableAvatar";
import FollowingList from "@/components/FollowingList";
import {
  getReviews,
  getFollowers,
  getFollowing,
  unfollowUser,
  type Review,
  type ProfileUser,
} from "@/services/api";

interface Props {
  user: {
    name?: string | null;
    surname?: string | null;
    user_name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  showTitle?: boolean;
}

export default function ProfilePanel({ user, showTitle = true }: Props) {
  const { updateUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<ProfileUser[]>([]);
  const [following, setFollowing] = useState<ProfileUser[]>([]);
  const [followLoading, setFollowLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<number>>(new Set());
  const [unfollowError, setUnfollowError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [reviewsData, followersData, followingData] = await Promise.all([
          getReviews(),
          getFollowers(),
          getFollowing(),
        ]);
        if (active) {
          setReviews(reviewsData);
          setFollowers(followersData);
          setFollowing(followingData);
        }
      } catch {
        /* If it fails, we simply don't show statistics */
      } finally {
        if (active) {
          setLoading(false);
          setFollowLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = reviews.length;
  const yes = reviews.filter((r) => r.Recommended).length;
  const pct = total ? Math.round((yes / total) * 100) : 0;
  const fullName = user ? `${user.name ?? ""} ${user.surname ?? ""}`.trim() : "";

  const handleUnfollow = async (targetId: number) => {
    setUnfollowError(null);
    setUnfollowingIds((prev) => new Set(prev).add(targetId));
    try {
      await unfollowUser(targetId);
      setFollowing((prev) => prev.filter((u) => u.id !== targetId));
    } catch {
      setUnfollowError("No se pudo dejar de seguir a este usuario.");
    } finally {
      setUnfollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  return (
    <>
      <Card as="article" className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <EditableAvatar
              image={user?.image}
              name={user?.name ?? ""}
              onUpdate={(url) => updateUser({ image: url })}
            />
            <div className="min-w-0">
              {showTitle && (
                <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu perfil</p>
              )}
              <h2 className="mt-1 truncate font-display text-2xl font-semibold text-cream">
                {fullName || "Tu perfil"}
              </h2>
              <p className="truncate text-sm text-faint">@{user?.user_name ?? "usuario"}</p>
            </div>
          </div>
          <div className="flex items-start gap-6 shrink-0">
            <button
              type="button"
              onClick={() => setShowFollowers(true)}
              className="text-center transition hover:opacity-80"
            >
              <p className="font-display text-2xl font-bold text-cream">{followLoading ? "…" : followers.length}</p>
              <p className="text-xs text-faint">seguidores</p>
            </button>
            <button
              type="button"
              onClick={() => setShowFollowing(true)}
              className="text-center transition hover:opacity-80"
            >
              <p className="font-display text-2xl font-bold text-cream">{followLoading ? "…" : following.length}</p>
              <p className="text-xs text-faint">seguidos</p>
            </button>
          </div>
        </div>

        <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-dim">Correo</dt>
            <dd className="truncate font-medium text-cream">{user?.email ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-dim">Usuario</dt>
            <dd className="font-medium text-cream">@{user?.user_name ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-ink/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-faint">Veredictos</p>
            <p className="mt-1 font-display text-3xl font-bold text-acid">{loading ? "…" : total}</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-faint">Recomienda</p>
            <p className="mt-1 font-display text-3xl font-bold text-cream">{loading ? "…" : `${pct}%`}</p>
          </div>
        </div>

        {!loading && total > 0 && (
          <div className="mt-4">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-ink">
              <div className="bg-acid" style={{ width: `${pct}%` }} />
              <div className="bg-coral" style={{ width: `${100 - pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-faint">
              <span>{yes} sí</span>
              <span>{total - yes} no</span>
            </div>
          </div>
        )}
      </Card>

      {showFollowers && (
        <FollowingList
          users={followers}
          title="Seguidores"
          emptyText="Aún no tienes seguidores."
          onClose={() => setShowFollowers(false)}
        />
      )}

      {showFollowing && (
        <FollowingList
          users={following}
          title="Siguiendo"
          unfollowingIds={unfollowingIds}
          error={unfollowError}
          onClose={() => { setShowFollowing(false); setUnfollowError(null); }}
          onUnfollow={handleUnfollow}
        />
      )}
    </>
  );
}
