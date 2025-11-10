import React, { useEffect, useState } from "react";

export default function MovieReviews({ movieId, userId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                let url = "http://localhost:3500/api/reviews";
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

    if (loading) return <p className="text-center">Cargando reseñas...</p>;
    if (reviews.length === 0)
        return <p className="text-center opacity-70">No hay reseñas todavía.</p>;

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
                <div key={index} className="card card-dash bg-base-100 w-90">
                    <div className="card-body">
                        <h2 className="card-title">
                            {userId ? review.movie_title : review.username}
                        </h2>
                        <p>{review.review}</p>
                        <div className="card-actions justify-end">
                            <button className="btn">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    className="size-[1.2em]"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                                    />
                                </svg>
                                Like
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
