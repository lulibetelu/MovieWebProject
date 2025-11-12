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
        methods: ["GET", "POST"], // Métodos HTTP permitidos
        allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
        credentials: true,
    }),
);

//permite que express entienda los datos que le mandan en el form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    }),
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
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"; // MongoDB URI from env, fallback to localhost
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

// ASI SE USA:
// app.get("/profile", requireLogin, async (req, res) => { ... });

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
    const limit = req.query.limit < 20 ? req.query.limit : 18;
    const page = parseInt(req.query.pagina) || 1;
    const offset = (page - 1) * 20;

    // Los placeholders en pg son $1, $2, etc.
    const queryDef = `
      SELECT * 
      FROM (
        SELECT * FROM search_all($1, 1000000)
        UNION ALL
        SELECT keyw.movie_id, keyw.title, 'movie'::TEXT AS type 
        FROM search_movies_by_keyword($2) AS keyw
      ) AS combined
    OFFSET $3
      ;
    ` // ILIKE es case-insensitive en Postgres
    const values = [`%${searchTerm}%`, searchTerm, offset];

    const queryMovies =`
        (
            SELECT
               m.movie_id,
               m.title
            FROM Movies.movie m
            WHERE m.title ILIKE $1
            ORDER BY m.popularity DESC NULLS LAST
        )
        UNION ALL
        SELECT keyw.movie_id, keyw.title
        FROM movies.search_movies_by_keyword($4) AS keyw
        LIMIT $2 OFFSET $3;
    `
    const movieValues = [`%${searchTerm}%`, limit, offset, searchTerm];

    const queryActors =
        `SELECT
            p.person_id,
            p.person_name
        FROM person p
        JOIN movie_cast mc ON mc.person_id = p.person_id
        WHERE p.person_name ILIKE $1
        GROUP BY p.person_id, p.person_name
        LIMIT $2 OFFSET $3;`

    const actorValues = [`%${searchTerm}%`, limit, offset];

    const queryDirectors =
        `SELECT
            p.person_id,
            p.person_name
        FROM person p
        JOIN movie_crew mc ON mc.person_id = p.person_id
        JOIN department d ON d.department_id = mc.department_id
        WHERE p.person_name ILIKE $1
          AND mc.job = 'Director'
        GROUP BY p.person_id, p.person_name
        ORDER BY p.person_name
        LIMIT $2 OFFSET $3;`
    const directoresValues = [`%${searchTerm}%`, limit, offset];

    try {
        // Usar db.query que devuelve una promesa y acceder a .rows
        const pelis = (await db.query(queryMovies, movieValues)).rows;
        const actores = (await db.query(queryActors, actorValues)).rows;

        const dir = (await db.query(queryDirectors, directoresValues)).rows;

        const searchInfo = {
            movies: [],
            actors: [],
            directors: [],
        }

        pelis.forEach((pelicula) => {
            searchInfo.movies.push({
                name: pelicula.title,
                id: pelicula.movie_id,
            });
        });

        actores.forEach((actor) => {
            searchInfo.actors.push({
                id: actor.person_id,
                name: actor.person_name,
            });
        });

        dir.forEach((director) => {
            searchInfo.directors.push({
                id: director.person_id,
                name: director.person_name,
            })
        })

        if (API_MODE) {
            res.json({
                searchInfo,
                tmdbApiKey: process.env.TMDB_API_KEY,
                searchTerm,
            });
            return;
        }


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
        const movieResult = await db.query(
            "SELECT * FROM get_movie_by_id($1)",
            [movieId],
        );
        if (movieResult.rows.length === 0) {
            return res.status(404).send("Película no encontrada.");
        }
        const movieRow = movieResult.rows[0];

        // 2️⃣ Obtener cast y crew
        const crewCastResult = await db.query(
            "SELECT * FROM get_movie_crew_and_cast($1)",
            [movieId],
        );
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
            company: movieRow.company,
            language: movieRow.language,
            language_role: movieRow.language_role,
            directors: [],
            writers: [],
            cast: [],
            crew: [],
        };

        // 4️⃣ Clasificar las personas según su rol
        crewCastRows.forEach((row) => {
            const isActor =
                row.character_name !== null && row.character_name !== undefined;
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
        if (API_MODE) return res.json({ movie: movieData });
        res.render("pelicula", { movie: movieData });
    } catch (err) {
        if (DEBUG) console.error(err);
        if (API_MODE)
            return res
                .status(500)
                .json({ error: "Error al cargar los datos de la película." });
        res.render("error", {
            error: {
                message: "Error al cargar los datos de la película.",
                code: 500,
            },
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

        res.json({
            user: {
                username: user.username,
                email: user.email,
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

app.get("/reviews", async (req, res) =>{
    if (!req.session.user) {
        console.log("no logueado");
        return res.status(401).send("No estás logueado");
    }
    const userId = req.session.user.id;
    res.json({userId});
});
// ========== AUTH ==========
// ruta que recibe la informacion del form
app.post(API_URL + "/login", async (req, res) => {
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

        if (!isPasswordCorrect)
            return res
                .status(401)
                .json({ message: "Credenciales inválidas", popUp: true });

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        res.json({
            success: true,
            user: req.session.user,
            message: "Sesión iniciada",
        });
    } catch (error) {
        if (DEBUG) console.log(error);
        res.status(500).json({
            error: "Error del servidor al intentar iniciar sesión.",
        });
    }
});

app.post(API_URL + "/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // el 10 es el "nivel de seguridad"

        const id = await db.query(
            'INSERT INTO "user" (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword],
        );

        req.session.user = {
            id: id.rows[0].id,
            username,
            email,
        };
        res.json({
            success: true,
            user: req.session.user,
            message: "Usuario registrado y logueado",
        });
    } catch (err) {
        if (DEBUG) console.error(err);
        res.status(500).json({
            error: "Error al registrar el usuario (puede que el email ya exista)",
        });
    }
});

app.get(API_URL + "/me", (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }

    res.json({ authenticated: false, user: null });
});

app.post(API_URL + "/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err)
            return res.status(500).json({ error: "Error al cerrar sesión" });
        res.clearCookie("connect.sid");
        res.json({ success: true, message: "Sesión cerrada" });
    });
});

app.get(API_URL + "/persona/:id/photo", (req, res) => {
    const { id } = req.params;

    // 🔹 En un caso real buscarías el dato en la base o el filesystem
    const photo = {
        id,
        url: `http://localhost:3500/images/person_${id}.jpg`,
    };

    res.json(photo);
});

app.post("/api/reviews", async (req, res) => {
    try {
        const { userId, userName, movieId, movieName, texto } = req.body;
        //const userId = req.user?.id || 'anon'; // ejemplo si usás auth
        const newReview = {
            user_id: +userId,
            username: userName,
            movie_id: +movieId,
            movie_title: movieName,
            review: texto,
            created_at: new Date(),
        };
        const log = {
            user_id: +userId,
            event_type: 'Dejaste una reseña acerca de ' + movieName,
            entity_id: +movieId,
            timestamp: new Date()
        }

        await mdb.collection("reviews").insertOne(newReview);
        await mdb.collection("user_log").insertOne(log);
        res.status(201).json({ message: "Reseña guardada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar reseña" });
    }
});

app.get("/api/reviews", async (req, res) => {
    try {
        const { movieId, userId } = req.query;

        let filter = {};
        if (movieId) filter.movie_id = +movieId;
        if (userId) filter.user_id = +userId;

        const result = await mdb
            .collection("reviews")
            .find(filter)
            .sort({ created_at: -1 })
            .toArray();

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener reseñas" });
    }
});

app.get("/api/rating", async (req,res)=>{
    try {
        const {movieId, userId} = req.query;

        let filter = {};
        if (movieId) filter.movie_id = +movieId;
        if (userId) filter.user_id = +userId;



        const result = await mdb.collection('rating')
            .findOne(filter, { sort: { created_at: -1 } });
        res.json(result);

    }catch(err){
        console.log("wachooo algo fallo aca");
        console.error(err);
        res.status(500).json({ error: "Error al obtener ratings" });
    }

})

app.post("/api/rating", async (req, res) => {
    try {
        const { movie_id, user_id, movie_title, score } = req.body;


        if (!movie_id || !user_id || typeof score !== "number") {
            return res.status(400).json({ error: "Datos inválidos" });
        }

        const doc = {
            user_id: +user_id,
            movie_id: +movie_id,
            movie_title,
            score,
            created_at:new Date()
        };

        const log = {
            user_id: +user_id,
            event_type: 'Calificaste ' + movie_title + ' con ' + score + ' estrellas',
            entity_id: +movie_id,
            timestamp: new Date()
        }

        const result = await mdb.collection("rating").insertOne(doc);
        const log_result = await mdb.collection("user_log").insertOne(log);

        res.json({ success: true, insertedId: result.insertedId });
    } catch (err) {
        console.error("❌ Error al insertar rating:", err);
        res.status(500).json({ error: "Error al guardar rating" });
    }
});

app.post("/api/checkFavorites", async (req, res) => {

    try {
        const { user_id, movie_id } = req.body;

        if (!user_id || !movie_id) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        const fav = await mdb.collection("favorites").findOne({
            user_id: +user_id,
            movie_id: +movie_id
        });

        res.json({ isFavorite: !!fav });
    } catch (err) {
        console.error("❌ Error al obtener favorito:", err);
        res.status(500).json({ error: "Error al obtener favorito" });
    }
});

app.post("/api/favorites", async (req, res) => {
    try {
        const { user_id, movie_id, movie_title, favorite } = req.body;

        const col = mdb.collection("favorites");
        if(!user_id){
            res.status(500).json({ error: "Error al guardar favorito" });
            return;
        }

        if (favorite) {
            const log = {
                user_id: +user_id,
                event_type: 'Guardaste ' + movie_title + ' en tus favoritos',
                entity_id: +movie_id,
                timestamp: new Date()
            }
            // Insertar si no existe
            const existing = await col.findOne({ user_id: +user_id, movie_id: +movie_id });
            if (!existing) {
                await col.insertOne({ user_id: +user_id, movie_id: +movie_id, movie_title });
                await mdb.collection("user_log").insertOne(log);
            }
        } else {
            // Eliminar si se desactiva
            const log = {
                user_id: +user_id,
                event_type: 'Eliminaste ' + movie_title + ' de tus favoritos',
                entity_id: +movie_id,
                timestamp: new Date()
            }
            await col.deleteOne({ user_id: +user_id, movie_id: +movie_id });
            await mdb.collection("user_log").insertOne(log);
        }

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error al guardar favorito:", err);
        res.status(500).json({ error: "Error al guardar favorito" });
    }
});

app.get("/api/activity/:userId", async (req, res) => {
    try {
        let { userId } = req.params;
        if(req.session.user){
            userId = req.session.user.id;
        }

        const parsedId = Number(userId);
        if (isNaN(parsedId)) {
            return res.status(400).json({ error: "ID de usuario inválido" });
        }

        const activities = await mdb.collection("user_log")
            .find({ user_id: parsedId })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        res.json(activities);
    } catch (error) {
        console.error("Error al obtener la actividad:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
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
