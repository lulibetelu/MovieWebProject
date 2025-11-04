import { useTab } from "../../../stores/TabContext";

export default function TabContent({
    movies = [],
    actors = [],
    directors = [],
}) {
    const { activeTab } = useTab();

    return (
        <>
            {/* PELÍCULAS */}
            <section
                id="peliculas"
                className={activeTab === "peliculas" ? "tab-panel" : "hidden"}
            >
                <h2 className="text-xl md:text-2xl font-bold mb-4">
                    Películas
                </h2>
                {movies.length === 0 ? (
                    <div className="alert alert-warning" role="alert">
                        <span>No hay resultados.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {movies.map((movie, idx) => (
                            <a
                                key={movie.id ?? movie.movie_id ?? idx}
                                href={`/pelicula/${movie.id ?? movie.movie_id}`}
                                className="card bg-base-100 border border-base-300 hover:border-primary transition shadow-sm hover:shadow-primary/20"
                                aria-label={`Ver detalle de ${movie.title ?? movie.name}`}
                            >
                                <div className="card-body">
                                    <h3 className="card-title">
                                        {movie.title ?? movie.name}
                                    </h3>
                                    <div className="card-actions justify-end">
                                        <span className="btn btn-primary btn-sm">
                                            Ver detalle
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            {/* ACTORES */}
            <section
                id="actores"
                className={activeTab === "peliculas" ? "tab-panel" : "hidden"}
            >
                <h2 className="text-xl md:text-2xl font-bold mb-4">Actores</h2>
                {actors.length === 0 ? (
                    <div className="alert alert-warning" role="alert">
                        <span>No hay resultados.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actors.map((actor, idx) => (
                            <a
                                key={actor.id ?? actor.person_id ?? idx}
                                href={`/persona/${actor.id ?? actor.person_id}`}
                                className="card bg-base-100 border border-base-300 hover:border-primary transition shadow-sm hover:shadow-primary/20"
                                aria-label={`Ver perfil de ${actor.person_name ?? actor.name}`}
                            >
                                <div className="card-body">
                                    <h3 className="card-title">
                                        {actor.person_name ?? actor.name}
                                    </h3>
                                    <div className="card-actions justify-end">
                                        <span className="btn btn-primary btn-sm">
                                            Ver perfil
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            {/* DIRECTORES */}
            <section
                id="directores"
                className={activeTab === "peliculas" ? "tab-panel" : "hidden"}
            >
                <h2 className="text-xl md:text-2xl font-bold mb-4">
                    Directores
                </h2>
                {directors.length === 0 ? (
                    <div className="alert alert-warning" role="alert">
                        <span>No hay resultados.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {directors.map((director, idx) => (
                            <a
                                key={director.id ?? director.person_id ?? idx}
                                href={`/persona/${director.id ?? director.person_id}`}
                                className="card bg-base-100 border border-base-300 hover:border-primary transition shadow-sm hover:shadow-primary/20"
                                aria-label={`Ver perfil de ${director.person_name ?? director.name}`}
                            >
                                <div className="card-body">
                                    <h3 className="card-title">
                                        {director.person_name ?? director.name}
                                    </h3>
                                    <div className="card-actions justify-end">
                                        <span className="btn btn-primary btn-sm">
                                            Ver perfil
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
