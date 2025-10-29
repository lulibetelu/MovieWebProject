import { useState, useEffect } from "react";

const apiUrl = import.meta.env.PUBLIC_API_URL;

import DomeGallery from "../ReactBits/DomeGallery";

export default function TopActors({}) {
    const [actors, setActors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActors = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${apiUrl}/top-actors/100`);
                const data = await response.json();

                if (!data.actors || !Array.isArray(data.actors)) {
                    throw new Error("Invalid data format");
                }

                setActors(data.actors);
            } catch (error) {
                console.error("Error fetching actors:", error);
                setActors([]); // En caso de error, seteamos un array vacío
            } finally {
                setLoading(false);
            }
        };

        fetchActors();
    }, []); // El array vacío asegura que el fetch se ejecute solo al montar el componente

    return (
        <div className="w-screen h-screen flex justify-center items-center overflow-hidden">
            {loading ? (
                <div className="flex justify-center items-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : (
                <DomeGallery
                    images={actors.map((el) => ({
                        src: el.person_name,
                        alt: el.person_name,
                        id: el.person_id,
                    }))}
                />
            )}
        </div>
    );
}
