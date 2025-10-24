// src/stores/TabContext.jsx
import React, { createContext, useContext, useState } from "react";

// Crear contexto
const TabContext = createContext();

// Provider
export function TabProvider({ children }) {
    const [activeTab, setActiveTab] = useState("peliculas"); // valor inicial

    return (
        <TabContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabContext.Provider>
    );
}

// Hook para usar el contexto
export function useTab() {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error("useTab debe usarse dentro de un TabProvider");
    }
    return context;
}
