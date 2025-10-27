import { useEffect, useState } from "react";
const base = "https://image.tmdb.org/t/p/w500";

export default function MovieImages({ data }) {
    const { title, apiKey } = data;

    const id = data?.id || -1;

    const [Movie_Image, setMovie_Image] = useState(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}`,
            );
            const datos = await res.json();
            console.log(datos);
            setMovie_Image(base + datos.results[0].poster_path);
        })();
    }, [data]);

    return Movie_Image ? (
        <img
            className={
                "h-full w-full object-cover " +
                (id != -1 ? "cursor-pointer" : "")
            }
            src={Movie_Image}
            onClick={() =>
                id != -1 ? (window.location.href = `/pelicula/${id}`) : null
            }
        />
    ) : (
        <div className="absolute inset-0 flex flex-col gap-4 p-4 bg-base-200 animate-pulse movie-skeleton rounded-xl overflow-hidden">
            <div className="skeleton h-3/4 w-full rounded-xl" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-3/4" />
        </div>
    );
}
