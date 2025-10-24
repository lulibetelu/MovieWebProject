import { useEffect, useState } from "react";
const base = "https://image.tmdb.org/t/p/w500"

export default function PersonImages({ data }) {
    const {personName, apiKey } = data
    const [Person_image, setPerson_image] = useState(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${personName}`);
            const datos = await res.json();
            setPerson_image(base + datos.results[0].profile_path);
            console.log(datos.results)
        })();
    }, [data]);

    return Person_image ?
            <img className="h-full w-full object-cover" src={Person_image}/>
     : (<div
            className="absolute inset-0 flex flex-col gap-4 p-4 bg-base-200 animate-pulse movie-skeleton rounded-xl overflow-hidden">
            <div className="skeleton h-3/4 w-full rounded-xl"/>
            <div className="skeleton h-4 w-32"/>
            <div className="skeleton h-4 w-3/4"/>
        </div>)
}
