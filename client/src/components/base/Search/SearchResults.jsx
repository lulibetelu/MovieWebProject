import { useEffect, useState } from "react";
import { useSearch } from "./SearchContext.jsx";

const API_URL = import.meta.env.PUBLIC_API_URL;

export default function SearchResults() {
    const { query, setQuery, tab, setTab, allResults, setAllResults } =
        useSearch();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // SOLO CLIENTE
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        if (!q) return;

        setQuery(q);

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_URL}/buscar?q=${encodeURIComponent(q)}&top=20`,
                );
                const data = await res.json();

                const all = {
                    movies: data.movies || [],
                    actors: data.actors || [],
                    directors: data.directors || [],
                };
                setAllResults(all);

                // Selección automática de tab según resultados
                let initialTab = "movies";
                if (all.movies.length > 0) initialTab = "movies";
                else if (all.actors.length > 0) initialTab = "actors";
                else if (all.directors.length > 0) initialTab = "directors";
                else initialTab = "notfound";

                setTab(initialTab);
                setResults(all[initialTab] || []);
            } catch (err) {
                console.error(err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []); // corre solo al montar

    // Actualizar resultados si cambia la tab desde Navbar
    useEffect(() => {
        if (!tab || !allResults) return;
        setResults(allResults[tab] || []);
    }, [tab, allResults]);

    if (!query) return <p>Ingresa algo para buscar</p>;
    if (loading) return <p>Cargando...</p>;
    if (tab === "notfound" || !results.length)
        return <p>No se encontraron resultados</p>;

    return (
        <div className="mt-4">
            {results.map((item) => (
                <div key={item.id} className="p-2 border-b">
                    {item.title || item.name}
                </div>
            ))}
        </div>
    );
}
