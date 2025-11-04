import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState("movies");
    const [allResults, setAllResults] = useState({
        movies: [],
        actors: [],
        directors: [],
    });

    return (
        <SearchContext.Provider
            value={{ query, setQuery, tab, setTab, allResults, setAllResults }}
        >
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    return useContext(SearchContext);
}
