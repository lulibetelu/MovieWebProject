import { useTab } from "../../../stores/TabContext";

export default function TabBar() {
    const { activeTab, setActiveTab } = useTab();

    return (
        <div className="tabs tabs-lift top-10 translate-y-[12px]">
            {["peliculas", "actores", "directores"].map((tab) => (
                <label key={tab} className="tab">
                    <input
                        type="radio"
                        name="my_tabs_3"
                        value={tab}
                        checked={activeTab === tab}
                        onChange={() => setActiveTab(tab)}
                    />
                    {tab}
                </label>
            ))}
        </div>
    );
}
