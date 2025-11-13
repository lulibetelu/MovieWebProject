import { useEffect, useState } from "react";
import MovieImages from "../TMDB_Images/MovieImages";

export default function FavoriteMovies({ userId, apiUrl }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        (async () => {
            try {
                const res = await fetch(`${apiUrl}/favorites?userId=${userId}`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Error al obtener favoritos");

                const data = await res.json();
                setFavorites(data);
            } catch (err) {
                console.error(err);
                setError("No se pudieron cargar tus películas favoritas.");
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <span className="loading loading-spinner loading-lg text-warning"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 py-10 text-lg">
                {error}
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center text-gray-400 py-10 text-lg">
                No tenés películas favoritas todavía 🍿
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {favorites.map((fav) => (
                <div
                    key={fav.movie_id}
                    className="card bg-base-200 shadow-xl transition-transform hover:scale-105 hover:shadow-2xl duration-300"
                >
                    <figure className="relative h-80 overflow-hidden rounded-t-xl">
                        <MovieImages data={{ title: fav.movie_title, id: fav.movie_id }} />
                    </figure>
                    <div className="card-body text-center">
                        <h2 className="card-title justify-center text-orange-400">
                            {fav.movie_title}
                        </h2>
                        <div className="mt-3">
                            <button
                                className="btn btn-outline btn-warning"
                                onClick={() => (window.location.href = `/pelicula/${fav.movie_id}`)}
                            >
                                Ver detalles
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
