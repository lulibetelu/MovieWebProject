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
            }else{
                id=datos.results[0].id;
            }

            const res2 = await fetch(
                `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`
            );
            const datos2 = await res2.json();
            console.log(datos2.results.length)
            if (
                datos2.results.length === 0 ||
                datos2.results[0].key === null
            ) {
                setMovieTrailer(defaultUrl);
                return;
            }



            setMovieTrailer(base + datos2.results[0].key);
        })();
    }, [data]);

    return (
        <div className="w-full max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-lg border border-primary/30 bg-black">
            {movieTrailer ? (
                <iframe
                    className="w-full h-full"
                    src={movieTrailer.replace("watch?v=", "embed/")}
                    title="Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-base-200 animate-pulse">
                    <span className="text-sm opacity-70">Cargando trailer...</span>
                </div>
            )}
        </div>
    );
}
