import { useEffect, useState } from "react";

import defaultImg from "../../assets/img/default-movie.jpg";
const base = "https://image.tmdb.org/t/p/w500";

const apiKey = import.meta.env.PUBLIC_TMDB_API_KEY;

export default function MovieImages({ data }) {
    const { title } = data;

    const id = data?.id || -1;

    const [movieImage, setMovieImage] = useState(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}`,
            );

            const datos = await res.json();
            if (
                datos.results.length === 0 ||
                datos.results[0].poster_path === null
            ) {
                setMovieImage(defaultImg.src);
                return;
            }

            setMovieImage(base + datos.results[0].poster_path);
        })();
    }, [data]);

    return movieImage ? (
        <img
            className={
                "h-full w-full object-cover " +
                (id != -1 ? "cursor-pointer" : "")
            }
            src={movieImage}
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
