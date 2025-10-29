import { useEffect, useState } from "react";

import defaultImg from "../../assets/img/default-person.png";
const base = "https://image.tmdb.org/t/p/w500";

const apiKey = import.meta.env.PUBLIC_TMDB_API_KEY;

export default function PersonImages({ data }) {
    const [personImage, setPersonImage] = useState(null);

    useEffect(() => {
        (async () => {
            if (!data || !data.personName) {
                setPersonImage(defaultImg.src);
                return;
            }

            const personName = data.personName;
            const res = await fetch(
                `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${personName}`,
            );

            const datos = await res.json();
            if (
                !datos.results.length ||
                !datos.results[0].profile_path ||
                !datos.results[0].profile_path == "null"
            ) {
                setPersonImage(defaultImg.src);
                return;
            }

            setPersonImage(base + datos.results[0].profile_path);
        })();
    }, []);

    return personImage ? (
        <img className="h-full w-full object-cover" src={personImage} />
    ) : (
        <div className="absolute inset-0 flex flex-col gap-4 p-4 bg-base-200 animate-pulse movie-skeleton rounded-xl overflow-hidden">
            <div className="skeleton h-3/4 w-full rounded-xl" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-3/4" />
        </div>
    );
}
