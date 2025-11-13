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
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/40 to-yellow-400/30 border border-yellow-400/50 px-4 py-2 rounded-lg text-yellow-300 hover:from-yellow-500/60 hover:to-yellow-300/40 hover:text-yellow-100 shadow-[0_0_10px_rgba(255,200,0,0.3)] transition-all duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-yellow-300 animate-pulse">
                    <path d="M12 2l2.9 6.3L22 9.2l-5 4.9L18.3 22 12 18.5 5.7 22l1-7.9-5-4.9 7.1-1L12 2z" />
                </svg>
                <span className="font-semibold">Rate</span>
            </button>

            {open && (
                <dialog open className="modal modal-bottom sm:modal-middle">
                    <div className="modal-box bg-base-200 text-base-content relative">
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
                                className="btn bg-yellow-500/30 hover:bg-yellow-500/60 border border-yellow-400/40 text-yellow-200 font-semibold w-full"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
}
