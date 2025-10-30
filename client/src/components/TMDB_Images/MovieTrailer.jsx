import { useEffect, useState } from "react";


const base = "https://www.youtube.com/watch?v=";
const defaultUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1";
const apiKey = import.meta.env.PUBLIC_TMDB_API_KEY;

export default function MovieTrailer({ data }) {
    const { title } = data;
    let id = data?.id || -1;
    let key;

    const [movieTrailer, setMovieTrailer] = useState(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}`,
            );
            const datos = await res.json();
            if (
                datos.results.length === 0 ||
                datos.results[0].id === null
            ) {
                setMovieTrailer(defaultUrl);
                return;
            }

            const res2 = await fetch(
                `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`
            );
            const datos2 = await res2.json();
            if (
                datos2.results.length === 0 ||
                datos2.results[0].key === null
            ) {
                setMovieTrailer(defaultUrl);
                return;
            }

            key = datos2.results[0].key;



            setMovieTrailer(base + datos2.results[0].key);
        })();
    }, [data]);

    return movieTrailer ? (
        <iframe width="560" height="315" src={movieTrailer}
                title="YouTube video player" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen>

        </iframe>
    ) : (
        <div
            className="absolute inset-0 flex flex-col gap-4 p-4 bg-base-200 animate-pulse movie-skeleton rounded-xl overflow-hidden">
            <div className="skeleton h-3/4 w-full rounded-xl"/>
            <div className="skeleton h-4 w-32"/>
            <div className="skeleton h-4 w-3/4"/>
        </div>
    );
}
