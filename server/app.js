// Se debe crear archivo .env con las variables de entorno de la base de datos
// DB_USER=postgres
// DB_PASSWORD=<password_de_la_base_de_datos>
// DB_HOST=localhost
// DB_PORT=5432
// DB_DATABASE=movies

require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");

const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3500;



// Habilitar CORS para el origen del frontend
app.use(
    cors({
        origin: "http://localhost:4321", // Permite solicitudes solo desde este origen
        methods: ["GET", "POST", "PUT", "DELETE"], // Métodos HTTP permitidos
        allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
    }),
);

//permite que express entienda los datos que le mandan en el form
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
    }),
    express.json(),
);
//--- path para la foto vacia
const noMovieBase =
    "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png";

const error = (msg = "", status = 500) => ({
    error: msg,
    status: status,
});

// Crear un "pool" de conexiones a PostgreSQL usando las variables de entorno
const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    options: `-c search_path=movies,public`, //modificar options de acuerdo al nombre del esquema
});

const DEBUG = process.env.DEBUG === "true" || false;
const API_MODE = process.env.API_MODE !== "false";
const API_URL = API_MODE ? "/api" : "";

//setup mongo
const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017"; // tu servidor local
const client = new MongoClient(uri);

let mdb; //mongo database
async function connectMDB() {
    try {
        await client.connect();
        console.log("✅ Conectado a MongoDB");
        mdb = client.db("movies"); // tu base de datos (por ejemplo “test”)
    } catch (err) {
        console.error("❌ Error al conectar a MongoDB:", err);
    }
}
connectMDB();


// * Ruta para la página de inicio
app.get(API_URL + "/", (req, res) => {
    if (API_MODE) {
        res.json({ Home: "Welcome to the Movie Web Project!" });
    } else {
        res.render("index");
    }
});

// * Ruta para buscar películas en la base de datos PostgreSQL
app.get(API_URL + "/buscar", async (req, res) => {
    // 4. Convertir a función async
    const searchTerm = req.query.q;
    const limit = req.query.limit < 20 ? req.query.limit : 20;
    const page = req.query.page || 1;
    const offset = (page - 1) * 20;

    // Los placeholders en pg son $1, $2, etc.
    const query = "SELECT * FROM search_all($1, " + limit + ", $2)"; // ILIKE es case-insensitive en Postgres
    const values = [`%${searchTerm}%`, offset];

    try {
        // Usar db.query que devuelve una promesa y acceder a .rows
        const result = await db.query(query, values);

        // Filter movies
        const filteredMovies = result.rows.filter(
            (row) => row.type === "movie",
        );

        // Filter actors
        const filteredActors = result.rows.filter(
            (row) => row.type === "actor",
        );

        // Filter directors
        const filteredDirectors = result.rows.filter(
            (row) => row.type === "director",
        );

        if (API_MODE) {
            res.json({
                movies: filteredMovies,
                actors: filteredActors,
                directors: filteredDirectors,
                tmdbApiKey: process.env.TMDB_API_KEY,
                searchTerm,
            });
            return;
        }

        res.render("resultado", {
            movies: filteredMovies,
            actors: filteredActors,
            directors: filteredDirectors,
            searchTerm,
            user: req.session.user,
        });
    } catch (err) {
        if (DEBUG) console.log(err);
        if (API_MODE)
            return res.status(500).json(error("Error en la búsqueda."));
        res.render("error", { error: err });
    }
});

// * Ruta para la página de datos de una película particular (PostgreSQL)
app.get(API_URL + "/pelicula/:id", async (req, res) => {
    const movieId = parseInt(req.params.id);

    try {
        // 1️⃣ Obtener la info general de la película
        const movieResult = await db.query("SELECT * FROM get_movie_by_id($1)", [movieId]);
        if (movieResult.rows.length === 0) {
            return res.status(404).send("Película no encontrada.");
        }
        const movieRow = movieResult.rows[0];

        // 2️⃣ Obtener cast y crew
        const crewCastResult = await db.query("SELECT * FROM get_movie_crew_and_cast($1)", [movieId]);
        const crewCastRows = crewCastResult.rows;

        // 3️⃣ Armar el objeto final
        const movieData = {
            id: movieRow.movie_id ?? movieRow.id,
            title: movieRow.title,
            release_date: movieRow.release_date,
            overview: movieRow.overview,
            vote_average: movieRow.vote_average,
            budget: movieRow.budget,
            homepage: movieRow.homepage,
            popularity: movieRow.popularity,
            revenue: movieRow.revenue,
            runtime: movieRow.runtime,
            movie_status: movieRow.movie_status,
            tagline: movieRow.tagline,
            vote_count: movieRow.vote_count,
            country: movieRow.country,
            genre: movieRow.genre,
            company:movieRow.company,
            language: movieRow.language,
            language_role: movieRow.language_role,
            directors: [],
            writers: [],
            cast: [],
            crew: [],
        };

        // 4️⃣ Clasificar las personas según su rol
        crewCastRows.forEach((row) => {
            const isActor = row.character_name !== null && row.character_name !== undefined;
            if (isActor) {
                movieData.cast.push({
                    actor_id: row.person_id,
                    actor_name: row.person_name,
                    character_name: row.character_name,
                    cast_order: row.cast_order ?? null,
                });
            } else {
                // Clasificar segun departamento y job
                const member = {
                    crew_member_id: row.person_id,
                    crew_member_name: row.person_name,
                    job: row.job ?? null,
                };

                if (row.job === "Director") {
                    movieData.directors.push(member);
                } else if (["Writer", "Screenplay"].includes(row.job)) {
                    movieData.writers.push(member);
                } else {
                    movieData.crew.push(member);
                }
            }
        });

        // 5️⃣ Responder
        if (API_MODE) return res.json({ movie: movieData});
        res.render("pelicula", { movie: movieData });

    } catch (err) {
        if (DEBUG) console.error(err);
        if (API_MODE)
            return res.status(500).json({ error: "Error al cargar los datos de la película." });
        res.render("error", {
            error: { message: "Error al cargar los datos de la película.", code: 500 },
        });
    }
});

// * Ruta para obtener información de una persona
app.get(API_URL + "/persona/:id", async (req, res) => {
    const personID = req.params.id;

    const offset = req.query.offset
        ? Math.max(parseInt(req.query.offset), 0)
        : 0;

    const AscOrDesc = req.query.desc === "f" ? "ASC" : "DESC";

    let order = "";
    switch (req.query.order) {
        case "Popularity":
            order = "m.popularity";
            break;
        case "Release_date":
            order = "m.release_date";
            break;
        case "Title":
            order = "m.title";
            break;
        default:
            order = "m.popularity";
    }

    const actorQuery = `
        SELECT p.person_id, p.person_name, m.title,m.movie_id,mc.character_name, g.gender, m.release_date, m.popularity, COUNT(*) OVER() AS total_movies
        FROM person p
        INNER JOIN movie_cast mc on mc.person_id = p.person_id
        INNER JOIN movie m on m.movie_id = mc.movie_id
        INNER JOIN gender g on mc.gender_id = g.gender_id
        WHERE p.person_id = $1
        ORDER BY ${order} ${AscOrDesc}
        LIMIT 8 OFFSET $2;
    `;
    const directorQuery = `
        SELECT p.person_id, p.person_name, mc.movie_id, m.title, m.release_date, m.popularity, COUNT(*) OVER() AS total_movies
        FROM person p
        INNER JOIN movie_crew mc on p.person_id = mc.person_id
        INNER JOIN movie m on m.movie_id = mc.movie_id
        WHERE p.person_id = $1 and mc.job = 'Director'
        ORDER BY ${order} ${AscOrDesc}
        LIMIT 8 OFFSET $2;
    `;

    try {
        const actors = (await db.query(actorQuery, [personID, offset])).rows;
        const directors = (await db.query(directorQuery, [personID, offset]))
            .rows;

        if (actors.length === 0 && directors.length === 0) {
            return res.status(404).send("Persona no encontrada.");
        }

        const personData = {
            person_id: personID,
            person_name:
                actors.length === 0
                    ? directors[0].person_name
                    : actors[0].person_name,
            gender: actors.length === 0 ? "Male" : actors[0].gender,
            offset: offset,
            order: req.query.order,
            ascOrDesc: AscOrDesc === "DESC" ? "t" : "f",
            actedMovies: [],
            directedMovies: [],
            totalActedMovies: actors.length === 0 ? 0 : actors[0].total_movies,
            totalDirectedMovies:
                directors.length === 0 ? 0 : directors[0].total_movies,
        };

        actors.forEach((actor) => {
            personData.actedMovies.push({
                title: actor.title,
                movie_id: actor.movie_id,
                character_name: actor.character_name,
                release_date: actor.release_date,
                photo_path: noMovieBase,
                popularity: actor.popularity,
            });
        });

        directors.forEach((director) => {
            personData.directedMovies.push({
                title: director.title,
                movie_id: director.movie_id,
                release_date: director.release_date,
                photo_path: noMovieBase,
                popularity: director.popularity,
            });
        });

        if (API_MODE) {
            res.json({
                personData,
                tmdbApiKey: process.env.TMDB_API_KEY,
            });
            return;
        }

        res.render("persona", {
            personData,
            tmdbApiKey: process.env.TMDB_API_KEY,
        });
    } catch (err) {
        if (DEBUG) console.log(err);
        if (API_MODE)
            return res
                .status(500)
                .json(error("Error al cargar la información de la persona"));

        res.render("persona", { error: err });
    }
});

app.get("/profile", async (req, res) => {
    if (!req.session.user)
        return res.status(404).json({ error: "No se pudo el usuario" });

    const userId = req.session.user.id;

    try {
        const userResult = await db.query(
            'SELECT username, email FROM "user" WHERE id = $1',
            [userId],
        );
        const user = userResult.rows[0];

        /*const ratedResult = await db.query(
                "SELECT COUNT(*) FROM user_movie WHERE user_id = $1 AND rating IS NOT NULL",
                [userId],
            );

            const ratedMovies = parseInt(ratedResult.rows[0].count);

            const reviewResult = await db.query(
                "SELECT COUNT(*) FROM user_movie WHERE user_id = $1 AND review IS NOT NULL",
                [userId],
            );
            const writtenReviews = parseInt(reviewResult.rows[0].count);

            //const lastRatedResult = await db.query( );


            //const lastReviewsResult = await db.query( );
        */
        res.json({
            user: {
                username: user.username,
                email: user.email,
                //ratedMovies,
                //writtenReviews,
                //lastRated: lastRatedResult.rows,
                // lastReviews: lastReviewsResult.rows,
            },
        });
    } catch (error) {
        if (DEBUG) console.error("Error al cargar el perfil:", error);
        res.status(500).json({
            error: "Error al cargar el perfil del usuario.",
        });
    }
});

app.get(API_URL + "/top/:limit", async (req, res) => {
    // Validate limit parameter
    const limit =
        parseInt(req.params.limit) >= 40 ? 40 : parseInt(req.params.limit);

    try {
        const topMoviesResult = await db.query(
            `SELECT * FROM get_top_movies_by_genre(${limit})`,
            [],
        );

        // Not found
        if (!topMoviesResult.rows) {
            return res.status(404).json({
                error: "No se encontraron películas.",
            });
        }

        const result = {};
        topMoviesResult.rows.forEach((movie) => {
            const key = movie.genre_name.toLowerCase();
            if (!result[key]) result[key] = [];

            result[key].push({
                title: movie.title,
                popularity: movie.popularity,
                id: movie.id,
            });
        });

        res.json({
            movies: result,
            tmdbApiKey: process.env.TMDB_API_KEY,
        });
    } catch (error) {
        if (DEBUG)
            console.error("Error al obtener las películas más vistas:", error);
        res.status(500).json({
            error: "Error al obtener las películas más vistas.",
        });
    }
});

app.get(API_URL + "/top-directors/:limit", async (req, res) => {
    // Validate limit parameter
    const limit =
        parseInt(req.params.limit) >= 50 ? 50 : parseInt(req.params.limit);

    try {
        const topDirectorsResult = await db.query(
            `SELECT person_id, person_name FROM get_top_directors(${limit})`,
            [],
        );

        // Not found
        if (!topDirectorsResult.rows) {
            return res.status(404).json({
                error: "No se encontraron películas.",
            });
        }

        res.json({
            directors: topDirectorsResult.rows,
            tmdbApiKey: process.env.TMDB_API_KEY,
        });
    } catch (error) {
        if (DEBUG)
            console.error(
                "Error al obtener los directores más populares:",
                error,
            );
        res.status(500).json({
            error: "Error al obtener los directores más populares.",
        });
    }
});

app.get(API_URL + "/top-actors/:limit", async (req, res) => {
    // Validate limit parameter
    const limit =
        parseInt(req.params.limit) >= 100 ? 100 : parseInt(req.params.limit);

    try {
        const topActorsResult = await db.query(
            `SELECT person_id, person_name FROM get_top_actors(${limit})`,
            [],
        );

        // Not found
        if (!topActorsResult.rows) {
            return res.status(404).json({
                error: "No se encontraron actores.",
            });
        }

        res.json({
            actors: topActorsResult.rows,
            tmdbApiKey: process.env.TMDB_API_KEY,
        });
    } catch (error) {
        if (DEBUG)
            console.error("Error al obtener los actores más populares:", error);
        res.status(500).json({
            error: "Error al obtener los actores más populares.",
        });
    }
});

// ========== AUTH ==========
// ruta que recibe la informacion del form
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar al usuario por su email
        const result = await db.query('SELECT * FROM "user" WHERE email = $1', [
            email,
        ]);

        // Si no existe el usuario
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron el usuario" });
        }

        const user = result.rows[0]; // usuario encontrado en la base

        // Comparar contraseñas (bcrypt lo hace)
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.json({ popUp: true });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        res.json({ success: true });
    } catch (error) {
        if (DEBUG) console.log(error);
        res.status(500).json({
            error: "Error del servidor al intentar iniciar sesión.",
        });
    }
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // el 10 es el "nivel de seguridad"

        const id = await db.query(
            'INSERT INTO "user" (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword],
        );

        res.json({ success: true, id });
    } catch (err) {
        if (DEBUG) console.error(err);
        res.status(500).json({
            error: "Error al registrar el usuario (puede que el email ya exista)",
        });
    }
});

app.get("/logout", async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            if (DEBUG) console.error("Error al destruir la sesión:", err);
            return res.status(500).json({ error: "Error al cerrar sesión." });
        }

        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

app.get("/persona/:id/photo", (req, res) => {
    const { id } = req.params;

    // 🔹 En un caso real buscarías el dato en la base o el filesystem
    const photo = {
        id,
        url: `http://localhost:3500/images/person_${id}.jpg`,
    };

    res.json(photo);
});

app.listen(PORT, () => {
    if (API_MODE)
        return console.log(
            `Servidor corriendo modo API en http://localhost:${PORT} con DEBUG ${DEBUG}`,
        );
    console.log(
        `Servidor corriendo modo WEB en http://localhost:${PORT} con DEBUG ${DEBUG}`,
    );
});
