import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "@/components/Card";
import UserAvatar from "@/components/UserAvatar";
import {
  getUserProfile,
  getUserReviews,
  followUser,
  unfollowUser,
  type UserProfile,
  type Review,
} from "@/services/api";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profileData, reviewsData] = await Promise.all([
          getUserProfile(Number(id)),
          getUserReviews(Number(id)),
        ]);
        if (active) {
          setProfile(profileData);
          setReviews(reviewsData);
        }
      } catch {
        if (active) setError("Usuario no encontrado");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleFollowToggle = async () => {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    try {
      if (profile.IsFollowing) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
      setProfile((prev) => prev ? { ...prev, IsFollowing: !prev.IsFollowing } : null);
    } catch {
      // silently fail
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-faint">
          <Spinner />
          <span>Cargando perfil…</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-faint">{error || "Perfil no disponible"}</p>
        <Link
          to="/dashboard"
          className="mt-4 rounded-full border border-line px-5 py-2 text-sm font-semibold text-cream transition hover:border-cream/35 hover:bg-cream/5"
        >
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-faint transition hover:text-cream"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Volver
      </Link>

      <Card as="article" className="p-7 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar image={profile.Image} name={profile.Name} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-semibold text-cream">
                {profile.Name || "Usuario"}
              </h2>
              <p className="truncate text-sm text-faint">@{profile.UserName}</p>
            </div>
          </div>
          <div className="flex items-start gap-6 shrink-0">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-cream">{profile.FansCount}</p>
              <p className="text-xs text-faint">seguidores</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-cream">{profile.InfluencersCount}</p>
              <p className="text-xs text-faint">seguidos</p>
            </div>
          </div>
        </div>

        <div className="mt-6 ml-4">
          <button
            type="button"
            disabled={followBusy}
            onClick={handleFollowToggle}
            className={
              profile.IsFollowing
                ? "inline-flex items-center gap-2 rounded-full border border-coral px-5 py-2 text-sm font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-40"
                : "inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2 text-sm font-semibold text-ink transition hover:bg-[#d7f56e] disabled:opacity-40"
            }
          >
            {followBusy && <Spinner />}
            {followBusy
              ? "Actualizando…"
              : profile.IsFollowing
                ? "Dejar de seguir"
                : "Seguir"}
          </button>
        </div>
      </Card>

      <Card as="section" className="p-7 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-cream">
          Reseñas recientes
        </h3>

        {reviews.length === 0 ? (
          <p className="mt-4 text-dim">Este usuario aún no ha escrito reseñas.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {[...reviews]
              .sort((a, b) => b.id - a.id)
              .slice(0, 10)
              .map((r) => (
                <article
                  key={r.id}
                  className="rounded-2xl border border-line bg-ink/60 p-5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        r.Recommended
                          ? "rounded-full border-[1.5px] border-acid bg-acid/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-acid"
                          : "rounded-full border-[1.5px] border-coral bg-coral/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-coral"
                      }
                    >
                      {r.Recommended ? "Recomiendo" : "No recomiendo"}
                    </span>
                    {r.ProductName && (
                      <span className="text-sm text-faint">sobre {r.ProductName}</span>
                    )}
                  </div>
                  <p className="mt-3 leading-relaxed text-dim">
                    {r.Description || "Sin descripción."}
                  </p>
                </article>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
