import { useState, useEffect } from "react";

export default function RateMovie({ data }) {
    const { movieTitle, movieId, userId } = data;
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    useEffect(() => {
        const fetchUserRating = async () => {
            try {
                const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/rating?movieId=${movieId}&userId=${userId}`);
                if (!res.ok) throw new Error("Error en la respuesta del servidor");
                const data = await res.json();
                if (data && data.score) setRating(data.score);
            } catch (err) {
                console.warn("⚠️ No se pudo obtener el rating previo:", err.message);
            }
        };

        fetchUserRating();
    }, [movieId, userId]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-500 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.75.75 0 011.04 0l2.12 2.12 2.83-.41a.75.75 0 01.85.85l-.41 2.83 2.12 2.12a.75.75 0 010 1.06l-2.12 2.12.41 2.83a.75.75 0 01-.85.85l-2.83-.41-2.12 2.12a.75.75 0 01-1.06 0l-2.12-2.12-2.83.41a.75.75 0 01-.85-.85l.41-2.83-2.12-2.12a.75.75 0 010-1.06l2.12-2.12-.41-2.83a.75.75 0 01.85-.85l2.83.41 2.12-2.12z" />
                </svg>
                <span className="font-semibold">Rate</span>
            </button>

            {open && (
                <dialog open className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-base-200 text-base-content relative">

                        {/* 🔹 Botón de cierre arriba a la derecha */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                            aria-label="Cerrar"
                        >
                            ✖
                        </button>

                        <div className="flex flex-col items-center mt-3">
                            <div className="text-yellow-400 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-10 h-10">
                                    <path d="M12 2l2.9 6.3L22 9.2l-5 4.9L18.3 22 12 18.5 5.7 22l1-7.9-5-4.9 7.1-1L12 2z" />
                                </svg>
                            </div>

                            <p className="text-yellow-400 text-xs font-bold uppercase">
                                Rate this
                            </p>
                            <h2 className="text-lg font-semibold mb-3">{movieTitle}</h2>

                            <div className="flex gap-1 mb-4">
                                {[...Array(10)].map((_, i) => {
                                    const value = i + 1;
                                    const isActive = value <= (hover || rating);
                                    return (
                                        <svg
                                            key={i}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className={`w-7 h-7 cursor-pointer transition-transform ${
                                                isActive
                                                    ? "fill-yellow-400 scale-110"
                                                    : "fill-gray-500 hover:fill-yellow-300"
                                            }`}
                                            onClick={() => setRating(value)}
                                            onMouseEnter={() => setHover(value)}
                                            onMouseLeave={() => setHover(0)}
                                        >
                                            <path d="M12 2l2.9 6.3L22 9.2l-5 4.9L18.3 22 12 18.5 5.7 22l1-7.9-5-4.9 7.1-1L12 2z" />
                                        </svg>
                                    );
                                })}
                            </div>

                            <button
                                onClick={async () => {
                                    console.log(`Le diste ${rating}/10 a ${movieTitle}`);
                                    try {
                                        const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/rating`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                movie_id: movieId,
                                                user_id: userId,
                                                movie_title: movieTitle,
                                                score: rating,
                                            }),
                                        });
                                        const data = await res.json();
                                        console.log("✅ Respuesta del servidor:", data);
                                    } catch (err) {
                                        console.error("❌ Error en el POST:", err);
                                    }
                                    setOpen(false);
                                }}
                                className="btn btn-neutral w-full"
                            >
                                Rate
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
}
