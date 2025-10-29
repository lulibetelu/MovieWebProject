import { useState, useEffect } from "react";
import ChromaGrid from "../ReactBits/ChromaGrid";

const apiUrl = import.meta.env.PUBLIC_API_URL;

const colors = [
    {
        borderColor: "#4F46E5",
        gradient: "linear-gradient(145deg,#4F46E5,#000)",
    },
    {
        borderColor: "#10B981",
        gradient: "linear-gradient(210deg,#10B981,#000)",
    },
    {
        borderColor: "#F59E0B",
        gradient: "linear-gradient(165deg,#F59E0B,#000)",
    },
    {
        borderColor: "#EF4444",
        gradient: "linear-gradient(195deg,#EF4444,#000)",
    },
    {
        borderColor: "#8B5CF6",
        gradient: "linear-gradient(225deg,#8B5CF6,#000)",
    },
    {
        borderColor: "#06B6D4",
        gradient: "linear-gradient(135deg,#06B6D4,#000)",
    },
];

export default function TopDirectors({}) {
    const [directors, setDirectors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDirectors = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${apiUrl}/top-directors/8`);
                const data = await response.json();

                if (!data.directors || !Array.isArray(data.directors)) {
                    throw new Error("Invalid data format");
                }

                setDirectors(data.directors);
            } catch (error) {
                console.error("Error fetching directors:", error);
                setDirectors([]); // En caso de error, seteamos un array vacío
            } finally {
                setLoading(false);
            }
        };

        fetchDirectors();
    }, []); // El array vacío asegura que el fetch se ejecute solo al montar el componente

    return (
        <div className="w-full h-fit flex justify-center items-center">
            {loading ? (
                <div className="flex justify-center items-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : (
                <div style={{ height: "fit-content", position: "relative" }}>
                    <ChromaGrid
                        items={directors.map((el, idx) => ({
                            title: el.person_name,
                            id: el.person_id,
                            subtitle: "Director",
                            handle: "",
                            borderColor:
                                colors[idx % colors.length].borderColor,
                            gradient: colors[idx % colors.length].gradient,
                            url: `/persona/${el.person_id}`,
                        }))}
                        radius={300}
                        damping={0.45}
                        fadeOut={0.6}
                        ease="power3.out"
                    />
                </div>
            )}
        </div>
    );
}
