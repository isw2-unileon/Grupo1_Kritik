import { Link } from "react-router-dom";

export default function PublishReviewPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Publicar reseña</p>
        <h1 className="text-4xl font-semibold text-white">Publicar una nueva reseña</h1>
        <p className="max-w-3xl text-slate-300">
          Aquí podrás comenzar a redactar tu próxima reseña. Por ahora este espacio es un borrador visual sin conexión al backend.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white">Título de la reseña</h2>
          <p className="mt-3 text-slate-400">Escribe un título breve y descriptivo que resuma tu experiencia.</p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white">Puntos fuertes</h2>
          <p className="mt-3 text-slate-400">Agrega observaciones sobre aquello que más te gustó.</p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
        >
          Volver al inicio
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Comenzar reseña
        </button>
      </div>
    </div>
  );
}
