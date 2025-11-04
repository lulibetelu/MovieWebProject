// import { useState, useEffect } from "react";

export default function Navbar() {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get("tab") || "movies";
    const query = params.get("query") || "";

    const tabs = [
        { key: "movies", label: "Películas" },
        { key: "actors", label: "Actores" },
        { key: "directors", label: "Directores" },
    ];

    const handleTabClick = (tabKey) => {
        params.set("tab", tabKey);
        return `/buscar?${params.toString()}&tab=${tabKey}`;
    };

    return (
        <div className="tabs">
            {tabs.map((t) => (
                <a
                    key={t.key}
                    className={`tab ${currentTab === t.key ? "tab-active" : ""}`}
                    href={handleTabClick(t.key)}
                >
                    {t.label}
                </a>
            ))}
        </div>
    );
}
