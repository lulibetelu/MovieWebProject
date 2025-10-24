import { useEffect, useState } from "react";
const base = "https://image.tmdb.org/t/p/w500"

export default function PersonImages({personName}) {
    const [image, setImage] = useState(null);

    useEffect(() => {
        (async () => {
            console.log(personName)
            const res = await fetch(`https://api.themoviedb.org/3/search/person?api_key=fd71dd76c1309b2bb911971bdce52d2f&query=${personName}`);
            const data = await res.json();
            setImage(base + data.results[0].profile_path);
            console.log("hola" +data.results[0].profile_path);
        })();
    }, [personName]);

    return image ?
            <img className="h-full w-full object-cover" src={image}/>
     : (<div
            className="absolute inset-0 flex flex-col gap-4 p-4 bg-base-200 animate-pulse movie-skeleton rounded-xl overflow-hidden">
            <div className="skeleton h-3/4 w-full rounded-xl"/>
            <div className="skeleton h-4 w-32"/>
            <div className="skeleton h-4 w-3/4"/>
        </div>)
}
