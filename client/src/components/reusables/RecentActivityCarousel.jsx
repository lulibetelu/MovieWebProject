import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function RecentActivityCarousel() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Cambiá esta URL si usás otro puerto o ruta
    const API_URL = "http://localhost:3500/api/activity";

    useEffect(() => {
        async function fetchActivity() {
            try {
                setLoading(true);

                // 1️⃣ Obtener el usuario actual
                const userRes = await fetch(`${import.meta.env.PUBLIC_API_URL}/me`, {
                    method: "GET",
                    credentials: "include",
                });
                console.log("que es esto" + !userRes.ok)

                if (!userRes.ok) throw new Error("No se pudo obtener el usuario");

                const userData = await userRes.json();
                console.log("la data:" + userData.id);
                const userId = userData._id || userData.id;

                // 2️⃣ Usar el ID del usuario en la URL del fetch principal
                const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/activity/${userId}`, {
                    method: "GET",
                    credentials: "include", // necesario si usás cookies para auth
                });

                if (!res.ok) throw new Error("Error al obtener la actividad");
                const data = await res.json();

                setActivities(data);
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la actividad reciente.");
            } finally {
                setLoading(false);
            }
        }

        fetchActivity();
    }, []);

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? activities.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev === activities.length - 1 ? 0 : prev + 1
        );
    };

    if (loading) {
        return (
            <div className="card bg-base-100 border border-base-300 shadow-sm p-6 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="mt-2 text-base-content/70">Cargando actividad...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-base-100 border border-error/30 shadow-sm p-6 text-center">
                <p className="text-error">{error}</p>
            </div>
        );
    }

    if (!activities.length) {
        return (
            <div className="card bg-base-100 border border-base-300 shadow-sm p-6 text-center">
                <p className="text-base-content/70">No hay actividad reciente.</p>
            </div>
        );
    }

    const activity = activities[currentIndex];
    const formattedDate = format(new Date(activity.timestamp), "PPPp", {
        locale: es,
    });

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="card bg-base-100 border border-base-300 shadow-md relative">
                <div className="card-body p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-primary">
                        Actividad reciente
                    </h2>

                    <div className="flex flex-col gap-2">
                        <p className="text-base-content">{activity.event_type}</p>
                        <p className="text-sm text-base-content/60">{formattedDate}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <button
                            onClick={handlePrev}
                            className="btn btn-ghost btn-sm text-primary"
                        >
                            {/* Ícono izquierdo */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 19.5L8.25 12l7.5-7.5"
                                />
                            </svg>
                        </button>

                        <span className="text-sm opacity-60">
              {currentIndex + 1} / {activities.length}
            </span>

                        <button
                            onClick={handleNext}
                            className="btn btn-ghost btn-sm text-primary"
                        >
                            {/* Ícono derecho */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
