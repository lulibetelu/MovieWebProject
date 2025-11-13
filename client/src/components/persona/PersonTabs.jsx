import { useCallback, useMemo, useState } from "react";
import { API_URL } from "../../data/config";
import MovieImages from "../TMDB_Images/MovieImages.jsx";

const PAGE_SIZE = 8;

export default function PersonTabs({ personId, initial }) {
    // 🔹 Normalizar datos iniciales
    const init = useMemo(() => {
        const src = initial || {};
        const toNum = (v, def = 0) => (Number.isFinite(+v) ? +v : def);
        const toArr = (v) => (Array.isArray(v) ? v : []);
        return {
            order: src.order || "Popularity",
            desc:
                typeof src.ascOrDesc === "string"
                    ? src.ascOrDesc
                    : src.desc || "t",
            offsetAct: toNum(src.offsetAct),
            offsetDir: toNum(src.offsetDir),
            actedMovies: toArr(src.actedMovies),
            directedMovies: toArr(src.directedMovies),
            totalActedMovies: toNum(src.totalActedMovies),
            totalDirectedMovies: toNum(src.totalDirectedMovies),
        };
    }, [initial]);

    // 🔹 Estado global y por pestaña
    const [order, setOrder] = useState(init.order);
    const [desc, setDesc] = useState(init.desc);
    const [offsetAct, setOffsetAct] = useState(init.offsetAct);
    const [offsetDir, setOffsetDir] = useState(init.offsetDir);
    const [actedMovies, setActedMovies] = useState(init.actedMovies);
    const [directedMovies, setDirectedMovies] = useState(init.directedMovies);
    const [totalActed, setTotalActed] = useState(init.totalActedMovies);
    const [totalDirected, setTotalDirected] = useState(
        init.totalDirectedMovies,
    );
    const [activeTab, setActiveTab] = useState(
        init.actedMovies?.length ? "acted" : "directed",
    );
    const [loadingAct, setLoadingAct] = useState(false);
    const [loadingDir, setLoadingDir] = useState(false);
    const [error, setError] = useState("");

    const pageOf = (offset) => Math.floor(offset / PAGE_SIZE) + 1;

    // 🔹 Fetch reutilizable
    const fetchData = useCallback(
        async ({
            nextOffsetAct = offsetAct,
            nextOffsetDir = offsetDir,
            nextOrder = order,
            nextDesc = desc,
            changed = "both",
        }) => {
            setError("");
            if (["acted", "both"].includes(changed)) setLoadingAct(true);
            if (["directed", "both"].includes(changed)) setLoadingDir(true);

            try {
                const url = `${API_URL}/persona/${personId}?offsetAct=${nextOffsetAct}&offsetDir=${nextOffsetDir}&order=${encodeURIComponent(nextOrder)}&desc=${encodeURIComponent(nextDesc)}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const raw = await res.json();
                const data = raw?.personData ?? raw;

                if (Array.isArray(data.actedMovies))
                    setActedMovies(data.actedMovies);
                if (Array.isArray(data.directedMovies))
                    setDirectedMovies(data.directedMovies);
                if (Number.isFinite(+data.totalActedMovies))
                    setTotalActed(+data.totalActedMovies);
                if (Number.isFinite(+data.totalDirectedMovies))
                    setTotalDirected(+data.totalDirectedMovies);

                setOrder(data.order || nextOrder);
                setDesc(data.ascOrDesc || nextDesc);
                setOffsetAct(nextOffsetAct);
                setOffsetDir(nextOffsetDir);
            } catch (e) {
                setError(e?.message || "Error cargando datos");
            } finally {
                setLoadingAct(false);
                setLoadingDir(false);
            }
        },
        [API_URL, personId, offsetAct, offsetDir, order, desc],
    );

    // 🔹 Handlers reutilizables
    const onToggleDesc = () =>
        fetchData({ nextDesc: desc === "t" ? "f" : "t", changed: "both" });
    const onChangeOrder = (value) =>
        fetchData({ nextOrder: value, changed: "both" });
    const onPaginate = (tab, dir) => {
        const delta = dir === "prev" ? -PAGE_SIZE : PAGE_SIZE;
        const nextOffset =
            tab === "acted" ? offsetAct + delta : offsetDir + delta;
        const next = Math.max(0, nextOffset);
        if (tab === "acted" && next !== offsetAct)
            fetchData({ nextOffsetAct: next, changed: "acted" });
        if (tab === "directed" && next !== offsetDir)
            fetchData({ nextOffsetDir: next, changed: "directed" });
    };
    const onSwitchTab = async (tab) => {
        setActiveTab(tab);
        if (tab === "acted" && offsetAct !== 0)
            await fetchData({ nextOffsetAct: 0, changed: "acted" });
        if (tab === "directed" && offsetDir !== 0)
            await fetchData({ nextOffsetDir: 0, changed: "directed" });
    };

    // 🔹 Subcomponentes
    const SortControls = () => (
        <div className="flex mb-4 items-center">
            <button
                className="btn mr-2"
                onClick={onToggleDesc}
                title="Cambiar orden"
            >
                {desc === "t" ? "↓" : "↑"}
            </button>
            <details className="dropdown">
                <summary style={{ height: 40 }} className="btn btn-sm">
                    {order}
                </summary>
                <ul className="menu dropdown-content bg-base-100 rounded-box z-10 w-60 p-2 shadow">
                    {["Popularity", "Title", "Release_date"].map((opt) => (
                        <li key={opt}>
                            <button
                                type="button"
                                onClick={() => onChangeOrder(opt)}
                            >
                                {opt.replace("_", " ")}
                            </button>
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );

    const MovieCard = ({ movie }) => (
        <a className="link link-hover" href={`/pelicula/${movie.movie_id}`}>
            <div className="card bg-base-100 hover:scale-105 transition-all shadow-sm hover:shadow-md duration-200">
                <figure className="relative w-full h-70 rounded-xl overflow-hidden group cursor-pointer">
                    <MovieImages data={{ title: movie.title }} />
                </figure>
                <div className="card-body p-4">
                    <h2 className="card-title text-base">
                        {movie.title} (
                        {new Date(movie.release_date).getFullYear()})
                    </h2>
                    {movie.character_name && <p>{movie.character_name}</p>}
                </div>
            </div>
        </a>
    );

    const Pagination = ({ tab }) => {
        const isActed = tab === "acted";
        const offset = isActed ? offsetAct : offsetDir;
        const total = isActed ? totalActed : totalDirected;
        const loading = isActed ? loadingAct : loadingDir;
        const pageLength = isActed ? actedMovies.length : directedMovies.length;
        const nextEnabled =
            total > 0 ? offset + PAGE_SIZE < total : pageLength === PAGE_SIZE;

        const prevDisabled = offset <= 0 || loading;
        const nextDisabled = !nextEnabled || loading;

        return (
            <div className="join mt-6 flex justify-center">
                <button
                    className={`join-item btn ${prevDisabled ? "btn-disabled" : ""}`}
                    onClick={
                        !prevDisabled
                            ? () => onPaginate(tab, "prev")
                            : undefined
                    }
                >
                    «
                </button>
                <button className="join-item btn">Page {pageOf(offset)}</button>
                <button
                    className={`join-item btn ${nextDisabled ? "btn-disabled" : ""}`}
                    onClick={
                        !nextDisabled
                            ? () => onPaginate(tab, "next")
                            : undefined
                    }
                >
                    »
                </button>
            </div>
        );
    };

    const renderTabContent = (tab, movies, total, loading, labelEmpty) => (
        <div className="bg-base-100 border-base-300 p-6">
            {movies.length === 0 && !loading ? (
                <p>{labelEmpty}</p>
            ) : (
                <>
                    <SortControls />
                    <div className="grid grid-cols-4 gap-6">
                        {movies.map((movie) => (
                            <MovieCard
                                key={`${movie.movie_id}-${movie.title}`}
                                movie={movie}
                            />
                        ))}
                    </div>
                    <Pagination tab={tab} />
                </>
            )}
        </div>
    );

    // 🔹 Render principal
    return (
        <div className="w-full">
            <div className="tabs tabs-lift w-full">
                <button
                    type="button"
                    className={`tab ${activeTab === "acted" ? "tab-active" : ""}`}
                    onClick={() => onSwitchTab("acted")}
                >
                    Películas Actuadas
                </button>
                <button
                    type="button"
                    className={`tab ${activeTab === "directed" ? "tab-active" : ""}`}
                    onClick={() => onSwitchTab("directed")}
                >
                    Películas Dirigidas
                </button>
            </div>

            {error && (
                <div className="alert alert-error my-4">
                    <span>{error}</span>
                </div>
            )}

            {activeTab === "acted"
                ? renderTabContent(
                      "acted",
                      actedMovies,
                      totalActed,
                      loadingAct,
                      "No actuó en ninguna película",
                  )
                : renderTabContent(
                      "directed",
                      directedMovies,
                      totalDirected,
                      loadingDir,
                      "No dirigió ninguna película",
                  )}
        </div>
    );
}
