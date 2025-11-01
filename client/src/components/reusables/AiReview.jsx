import { useEffect, useState } from "react";

const AiReview = ({ reviews = [] }) => {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        let ignore = false;
        const controller = new AbortController();

        async function summarize() {
            console.log(null);

            if (!reviews || reviews.length === 0) {
                setSummary("Sin reseñas.");
                return;
            }

            try {
                // Unimos las reseñas en un solo string
                const text = reviews.join(". ");

                const res = await fetch("http://localhost:4321/api/summarize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();

                if (!ignore) {
                    setSummary(data?.summary ?? "error");
                }
            } catch (err) {
                if (!ignore) {
                    console.error("Error al conectar con la API:", err);
                    setSummary("error");
                }
            }
        }

        summarize();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, [reviews]);

    return summary === "error" ? (
        <p></p>
    ) : summary ? (
        <div className="flex flex-col gap-2">
            <h4 className="text-base-content text-xl font-semibold leading-snug">
                Resumen de las reseñas:
            </h4>

            <p className="text-base-content/90 text-lg">{summary || ""}</p>
        </div>
    ) : (
        <div class="skeleton h-16 w-full"></div>
    );
};

export default AiReview;
