// Se debe crear archivo .env con las variables de entorno de la base de datos
// DB_USER=postgres
// DB_PASSWORD=<password_de_la_base_de_datos>
// DB_HOST=localhost
// DB_PORT=5432
// DB_DATABASE=movies

require("dotenv").config();

const path = require("path");
const express = require("express");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3500;

//permite que express entienda los datos que le mandan en el form
app.use(express.urlencoded({ extended: true }));

const bcrypt = require("bcrypt");

const session = require("express-session");

app.use(
    session({
        secret: "clave-secreta", // poné una cadena aleatoria segura
        resave: false,
        saveUninitialized: false,
    })
);
//--- path para la foto vacia
const noMovieBase =
    "https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png";

// --- 🔥 Configurar LiveReload ---
const liveReloadServer = livereload.createServer({
    exts: ["ejs", "css", "js"],
    delay: 100,
});

liveReloadServer.watch(path.join(__dirname, "views"));
liveReloadServer.watch(path.join(__dirname, "public"));

// Middleware para inyectar el script en las páginas
app.use(connectLivereload());

// Serve static files from the "views" directory
app.set("views", path.join(process.cwd(), "views"));

// Servir archivos estáticos (CSS, JS, imágenes, etc.)
app.use(express.static("public"));

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
const API_MODE = process.env.API_MODE === "true" || false;
const API_URL = API_MODE ? "/api" : "";

// Configurar el motor de plantillas EJS
app.set("view engine", "ejs");

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
    const page = req.query.page || 1;
    const offset = (page - 1) * 20;

    // Los placeholders en pg son $1, $2, etc.
    const query = "SELECT * FROM search_all($1, 20, $2)"; // ILIKE es case-insensitive en Postgres
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
    // Convertir a async
    const movieId = req.params.id;

    const query = `
    SELECT
      movie.*,
      actor.person_name as actor_name,
      actor.person_id as actor_id,
      crew_member.person_name as crew_member_name,
      crew_member.person_id as crew_member_id,
      movie_cast.character_name,
      movie_cast.cast_order,
      department.department_name,
      movie_crew.job
    FROM movie
    LEFT JOIN movie_cast ON movie.movie_id = movie_cast.movie_id
    LEFT JOIN person as actor ON movie_cast.person_id = actor.person_id
    LEFT JOIN movie_crew ON movie.movie_id = movie_crew.movie_id
    LEFT JOIN department ON movie_crew.department_id = department.department_id
    LEFT JOIN person as crew_member ON crew_member.person_id = movie_crew.person_id
    WHERE movie.movie_id = $1
  `;

    try {
        const result = await db.query(query, [parseInt(movieId)]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).send("Película no encontrada.");
        }

        const movieData = {
            id: rows[0].movie_id,
            title: rows[0].title,
            release_date: rows[0].release_date,
            overview: rows[0].overview,
            directors: [],
            writers: [],
            cast: [],
            crew: [],
        };

        rows.forEach((row) => {
            if (
                row.crew_member_id &&
                row.crew_member_name &&
                row.department_name &&
                row.job
            ) {
                const isDuplicate = movieData.directors.some(
                    (crew_member) =>
                        crew_member.crew_member_id === row.crew_member_id,
                );
                if (
                    !isDuplicate &&
                    row.department_name === "Directing" &&
                    row.job === "Director"
                ) {
                    movieData.directors.push({
                        crew_member_id: row.crew_member_id,
                        crew_member_name: row.crew_member_name,
                        department_name: row.department_name,
                        job: row.job,
                    });
                }
            }
        });

        rows.forEach((row) => {
            if (
                row.crew_member_id &&
                row.crew_member_name &&
                row.department_name &&
                row.job
            ) {
                const isDuplicate = movieData.writers.some(
                    (crew_member) =>
                        crew_member.crew_member_id === row.crew_member_id,
                );
                if (
                    !isDuplicate &&
                    row.department_name === "Writing" &&
                    (row.job === "Writer" || row.job === "Screenplay")
                ) {
                    // Ajuste para más roles de escritura
                    movieData.writers.push({
                        crew_member_id: row.crew_member_id,
                        crew_member_name: row.crew_member_name,
                        department_name: row.department_name,
                        job: row.job,
                    });
                }
            }
        });

        rows.forEach((row) => {
            if (row.actor_id && row.actor_name && row.character_name) {
                const isDuplicate = movieData.cast.some(
                    (actor) => actor.actor_id === row.actor_id,
                );
                if (!isDuplicate) {
                    movieData.cast.push({
                        actor_id: row.actor_id,
                        actor_name: row.actor_name,
                        character_name: row.character_name,
                        cast_order: row.cast_order,
                    });
                }
            }
        });

        rows.forEach((row) => {
            if (
                row.crew_member_id &&
                row.crew_member_name &&
                row.department_name &&
                row.job
            ) {
                const isDuplicate = movieData.crew.some(
                    (crew_member) =>
                        crew_member.crew_member_id === row.crew_member_id,
                );
                if (!isDuplicate) {
                    if (
                        row.department_name !== "Directing" &&
                        row.department_name !== "Writing"
                    ) {
                        movieData.crew.push({
                            crew_member_id: row.crew_member_id,
                            crew_member_name: row.crew_member_name,
                            department_name: row.department_name,
                            job: row.job,
                        });
                    }
                }
            }
        });

        if (API_MODE) return res.json({ movie: movieData });

        res.render("pelicula", { movie: movieData });
    } catch (err) {
        if (DEBUG) console.log(err);
        if (API_MODE)
            return res
                .status(500)
                .json(error("Error al cargar los datos de la película."));

        res.render("error", {
            error: error("Error al cargar los datos de la película.", 500),
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
        const actors = (
            await db.query(actorQuery, [personID, offset])
        ).rows;
        const directors = (
            await db.query(directorQuery, [personID, offset])
        ).rows;

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
                tmdbApiKey: process.env.TMDB_API_KEY
            });
            return;
        }
  
        res.render("persona", { personData, tmdbApiKey: process.env.TMDB_API_KEY });
    } catch (err) {
        if (DEBUG) console.log(err);
        if (API_MODE)
            return res
                .status(500)
                .json(error("Error al cargar la información de la persona"));

        res.render("persona", { error: err });
    }
});

app.listen(PORT, () => {
    if (API_MODE)
        return console.log(
            `Servidor corriendo modo API en http://localhost:${PORT}`,
        );
    console.log(`Servidor corriendo modo WEB en http://localhost:${PORT}`);
});

// Cuando el servidor de livereload detecte un cambio, recarga el navegador
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
});

app.get("/login/", async (req, res) => {
    res.render("login")
});

// ruta que recibe la informacion del form
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Buscar al usuario por su email
        const result = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

        // Si no existe el usuario
        if (result.rows.length === 0) {
            return res.send("No existe una cuenta con ese email.");
        }

        const user = result.rows[0]; // usuario encontrado en la base

        // Comparar contraseñas (bcrypt lo hace)
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            res.send("Contraseña incorrecta");
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };
        res.redirect("/buscar?q=");

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).send("Error del servidor al intentar iniciar sesión.");
    }
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // el 10 es el "nivel de seguridad"

        const result = await db.query(
            'INSERT INTO "user" (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );

        res.redirect("/login")
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al registrar el usuario (puede que el email ya exista)");
    }
});

app.get("/profile", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = req.session.user.id;

    try {
        const userResult = await db.query(
            'SELECT username, email FROM "user" WHERE id = $1',
            [userId]
        );
        const user = userResult.rows[0];

        const ratedResult = await db.query(
            "SELECT COUNT(*) FROM user_movie WHERE user_id = $1 AND rating IS NOT NULL",
            [userId]
        );
        const ratedMovies = parseInt(ratedResult.rows[0].count);

        const reviewResult = await db.query(
            "SELECT COUNT(*) FROM user_movie WHERE user_id = $1 AND review IS NOT NULL",
            [userId]
        );
        const writtenReviews = parseInt(reviewResult.rows[0].count);

        const lastRatedResult = await db.query(`
          SELECT m.movie_id, m.title, um.rating
          FROM user_movie um
          JOIN movie m ON um.movie_id = m.movie_id
          WHERE um.user_id = $1 AND um.rating IS NOT NULL
          ORDER BY um.id DESC
          LIMIT 5
        `, [userId]);

        const lastReviewsResult = await db.query(`
          SELECT m.movie_id, m.title, um.review AS text
          FROM user_movie um
          JOIN movie m ON um.movie_id = m.movie_id
          WHERE um.user_id = $1 AND um.review IS NOT NULL
          ORDER BY um.id DESC
          LIMIT 5
        `, [userId]);

        res.render("movie_user", {
            user: {
                username: user.username,
                email: user.email,
                ratedMovies,
                writtenReviews,
                lastRated: lastRatedResult.rows,
                lastReviews: lastReviewsResult.rows
            }
        });

    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        res.status(500).send("Error al cargar el perfil del usuario.");
    }
});


