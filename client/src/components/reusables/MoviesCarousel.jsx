import MovieImages from "../TMDB_Images/MovieImages";

const MoviesCarousel = ({ movieGroup = [], title = "", idx = 0 }) => {
    const mGroup = movieGroup.reduce((acc, curr, index) => {
        if (index % 5 === 0) acc.push([]);
        acc[Math.floor(index / 5)].push(curr);
        return acc;
    }, []);

    return (
        <>
            {!mGroup ? (
                <h1 className="text-6xl text-primary font-bold mt-10 ml-5">
                    Movies not found. Server Error.
                </h1>
            ) : (
                <>
                    <div className="mt-5 w-full py-5 flex flex-col align-middle justify-center">
                        <div className="w-[90%] mx-auto bg-base-200 px-5 py-5 rounded-lg border-3 border-primary/90 shadow-primary/20 transition-shadow shadow-xl">
                            <h1 className="text-4xl text-base-content font-semibold p-4">
                                {`Most popular of "${title}"`} {/* GENRE */}
                            </h1>

                            <div className="carousel w-full mt-5 overflow-y-hidden overflow-x-scroll">
                                {mGroup.map((movies, oIdx) => {
                                    return (
                                        <div
                                            className="carousel-item w-full flex justify-center gap-4"
                                            id={`item-${idx}`}
                                            key={`group-${idx}-${oIdx}`}
                                        >
                                            {movies.length > 0 ? (
                                                movies.map((movie, index) => (
                                                    <div
                                                        className="card bg-base-300 shadow-xl cursor-pointer"
                                                        key={`${index}-${idx}`}
                                                    >
                                                        <MovieImages
                                                            data={{
                                                                title: movie.title,
                                                                id: movie.id,
                                                            }}
                                                        />

                                                        <div
                                                            className="card-body"
                                                            onClick={() =>
                                                                (window.location.href = `/pelicula/${movie.id}`)
                                                            }
                                                        >
                                                            <h2 className="card-title">
                                                                {typeof movie.title ===
                                                                "string"
                                                                    ? movie.title.slice(
                                                                          0,
                                                                          28,
                                                                      )
                                                                    : ""}
                                                            </h2>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    No movies in this group
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default MoviesCarousel;

{
    /* Carousel
            <div className="mt-10 w-full py-5 flex justify-center">
                <div className="w-[90%] bg-base-200 px-5 py-5 rounded-lg shadow-lg">
                    <div className="carousel w-full">
                        {hasOut ? (
                            out.map((movieGroup, index) => (
                                <div
                                    className="carousel-item w-full flex justify-center gap-4"
                                    id={`item-${index}`}
                                    key={`group-${index}`}
                                >
                                    {Array.isArray(movieGroup) &&
                                    movieGroup.length > 0 ? (
                                        movieGroup.map((img, idx) => (
                                            <div
                                                className="card bg-base-300 shadow-xl"
                                                key={`${index}-${idx}`}
                                            >
                                                <MovieImages
                                                    data={{
                                                        title: img,
                                                        apiKey: tmdbApiKey,
                                                    }}
                                                />
                                                <div className="card-body">
                                                    <h2 className="card-title">
                                                        {typeof img === "string"
                                                            ? img.slice(0, 28)
                                                            : String(img)}
                                                    </h2>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            No movies in this group
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : hasResult ? (
                            <h1>Loaded!</h1>
                        ) : (
                            <div className="text-center text-gray-500">
                                No movies available
                            </div>
                        )}
                    </div>
                </div>

            </div>
            */
}
