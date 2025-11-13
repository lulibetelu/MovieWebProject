import { useEffect, useState } from "react";

export default function MovieReviews({ movieId, userId, apiUrl }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                let url = apiUrl + "/reviews";
                if (movieId) url += `?movieId=${movieId}`;
                else if (userId) url += `?userId=${userId}`;

                const res = await fetch(url);
                const data = await res.json();
                setReviews(data);
            } catch (err) {
                console.error("Error al obtener reseñas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [movieId, userId]);

    if (loading)
        return (
            <div className="flex justify-center items-center py-16 gap-3 text-orange-300">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="text-lg">Cargando reseñas...</span>
            </div>
        );

    if (reviews.length === 0)
        return (
            <p className="text-center opacity-70 py-10 text-gray-400">
                No hay reseñas todavía.
            </p>
        );

    return (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 px-4 md:px-0">
            {reviews.map((review, index) => (
                <div
                    key={index}
                    className="group relative bg-[#1a0a05]/60 border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_25px_rgba(255,120,0,0.15)] hover:shadow-[0_0_40px_rgba(255,120,0,0.3)] hover:border-orange-400/50 transition-all duration-300 backdrop-blur-sm"
                >
                    {/* Brillo animado */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-orange-500/10 via-transparent to-transparent rounded-2xl"></div>

                    {/* Contenido */}
                    <div className="relative z-10 space-y-3">
                        <h2 className="text-xl font-bold text-orange-400 drop-shadow-[0_0_10px_rgba(255,150,0,0.3)]">
                            {userId ? review.movie_title : review.username}
                        </h2>
                        <p className="text-gray-300 leading-relaxed line-clamp-5">
                            “{review.review}”
                        </p>
                        {review.created_at && (
                            <p className="text-sm text-gray-500 italic">
                                {new Date(review.created_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
