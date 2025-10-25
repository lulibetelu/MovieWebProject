import LaserFlow from "./LaserFlow";
import { useRef } from "react";

// NOTE: You can also adjust the variables in the shader for super detailed customization
import BlurText from "../BlurText";
import TextType from "../TextType";
import imagenFondo from "../../../assets/img/movies-bg.jpg";

const colorPrimary = "#FF7216";

// Image Example Interactive Reveal Effect
export default function LaserFlowBox() {
    const revealImgRef = useRef(null);

    return (
        <div
            style={{
                height: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const el = revealImgRef.current;
                if (el) {
                    el.style.setProperty("--mx", `${x}px`);
                    el.style.setProperty("--my", `${y + rect.height * 0.5}px`);
                }
            }}
            onMouseLeave={() => {
                const el = revealImgRef.current;
                if (el) {
                    el.style.setProperty("--mx", "-9999px");
                    el.style.setProperty("--my", "-9999px");
                }
            }}
            className=""
        >
            <LaserFlow
                horizontalBeamOffset={0.1}
                horizontalSizing={0.6}
                verticalSizing={6}
                wispDensity={3.0}
                wispSpeed={18.0}
                wispIntensity={18}
                flowSpeed={0.6}
                flowStrength={0.3}
                fogIntensity={0.4}
                fogScale={0.12}
                fogFallSpeed={1.5}
                decay={1.5}
                falloffStart={1.0}
                verticalBeamOffset={0.0}
                color={colorPrimary}
                mouseTiltStrength={0.02}
            />

            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "86%",
                    backgroundColor: "#060010",
                    borderRadius: "20px",
                    border: "2px solid var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-base-content);",
                    fontSize: "2rem",
                    zIndex: 6,
                }}
                className="flex flex-col"
            >
                {/* Your content here */}

                {/* Title with tagline */}
                <div
                    className="mt-10 h-36 flex flex-col items-center"
                    style={{
                        fontFamily: "'Poppins', sans-serif !important;",
                        fontSize: "2rem",
                    }}
                >
                    <BlurText
                        text="Movie Web App!"
                        delay={150}
                        animateBy="words"
                        direction="top"
                        className="font-poppins text-5xl font-bold text-base-content md:text-7xl"
                    />

                    <TextType
                        text={[
                            "Discover your next favorite film",
                            "Find the best actor in a movie",
                            "Rate your favorite film",
                            "Share your reviews!",
                        ]}
                        typingSpeed={75}
                        pauseDuration={1500}
                        showCursor={true}
                        cursorCharacter="|"
                        className=" text-primary mt-4 text-md"
                    />
                    {/* <p className="mt-4 text-center text-lg md:text-xl"></p> */}
                </div>

                {/* Search Form */}
                <form
                    action="/buscar"
                    method="GET"
                    className="flex justify-center mb-10 mt-5 gap-2"
                >
                    <div className="relative w-full max-w-3xl">
                        {/* Search Icon */}
                        <svg
                            className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </svg>

                        {/* Input */}
                        <input
                            type="text"
                            name="q"
                            placeholder="Search your movie..."
                            className="w-full rounded-2xl border-3 border-primary/40 bg-[#060010]/50 py-3 pl-14 pr-4 text-xl text-base-content placeholder-gray-500 shadow-md outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_24px_var(--color-primary)] hover:shadow-[0_0_25px_var(--color-primary)]"
                        />

                        {/* Background Glow */}
                        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-400/20 to-orange-500/10 blur-xl"></div>
                    </div>

                    <button className="btn btn-primary btn-xl">
                        Explore
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2.5"
                            stroke="currentColor"
                            className="size-[1.2em]"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </form>
            </div>

            <img
                ref={revealImgRef}
                src={imagenFondo.src}
                alt="Reveal effect"
                style={{
                    position: "absolute",
                    width: "100%",
                    top: "-50%",
                    zIndex: 5,
                    mixBlendMode: "lighten",
                    opacity: 0.3,
                    pointerEvents: "none",
                    "--mx": "-9999px",
                    "--my": "-9999px",
                    WebkitMaskImage:
                        "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)",
                    maskImage:
                        "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                }}
            />
        </div>
    );
}
