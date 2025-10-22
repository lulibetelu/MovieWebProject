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

// Crear un "pool" de conexiones a PostgreSQL usando las variables de entorno
const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    options: `-c search_path=movies,public`, //modificar options de acuerdo al nombre del esquema
});

// Configurar el motor de plantillas EJS
app.set("view engine", "ejs");

// Ruta para la página de inicio
app.get("/", (req, res) => {
    res.render("index");
});

// Ruta para buscar películas en la base de datos PostgreSQL
app.get("/buscar", async (req, res) => {
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

        res.render("resultado", {
            movies: filteredMovies,
            actors: filteredActors,
            directors: filteredDirectors,
            searchTerm,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en la búsqueda.");
    }
});

// Ruta para la página de datos de una película particular (PostgreSQL)
app.get("/pelicula/:id", async (req, res) => {
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
        const result = await db.query(query, [movieId]);
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

        res.render("pelicula", { movie: movieData });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar los datos de la película.");
    }
});

app.get("/persona/:id", async (req, res) => {
    const personID = req.params.id;



    const offset = req.query.offset ? Math.max(parseInt(req.query.offset), 0) : 0;
    const allowedOrders = {
        popularity: 'm.popularity',
        release_date: 'm.release_date',
        title: 'm.title'
    };
    const order = allowedOrders[req.query.order] || 'm.popularity';

    const actorQuery = `
        SELECT p.person_id, p.person_name, m.title,m.movie_id,mc.character_name, g.gender, m.release_date, COUNT(*) OVER() AS total_movies
        FROM person p
        INNER JOIN movie_cast mc on mc.person_id = p.person_id
        INNER JOIN movie m on m.movie_id = mc.movie_id
        INNER JOIN gender g on mc.gender_id = g.gender_id
        WHERE p.person_id = $1
        ORDER BY ${order} DESC
        LIMIT 10 OFFSET $2;
    `;
    const directorQuery = `
        SELECT p.person_id, p.person_name, mc.movie_id, m.title, m.release_date, COUNT(*) OVER() AS total_movies
        FROM person p
        INNER JOIN movie_crew mc on p.person_id = mc.person_id
        INNER JOIN movie m on m.movie_id = mc.movie_id
        WHERE p.person_id = $1 and mc.job = 'Director';
    `;


    try{
        const actors = (await db.query(actorQuery,[personID,offset])).rows;
        const directors = (await db.query(directorQuery,[personID])).rows;

        if (actors.length === 0 && directors.length === 0) {
            return res.status(404).send("Persona no encontrada.");
        }

        const personData = {
            person_id: personID,
            person_name:
                actors.length === 0
                    ? directors[0].person_name
                    : actors[0].person_name,
            //gender: actors[0].gender,
            offset: offset,
            actedMovies: [],
            directedMovies: [],
            totalActedMovies: actors.length === 0? 0 : actors[0].total_movies,
            totalDirectedMovies: directors.length === 0? 0: directors[0].total_movies,
            order: order
        }

        actors.forEach((actor) => {
            personData.actedMovies.push({
                title: actor.title,
                movie_id: actor.movie_id,
                character_name: actor.character_name,
                release_date: actor.release_date,
            });
        });
        directors.forEach((director) => {
            personData.directedMovies.push({
                title: director.title,
                movie_id: director.movie_id,
                release_date: director.release_date,
            });
        });

        res.render("persona", { personData });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar la informacion de la persona");
    }
});

// Ruta para mostrar la página de un actor específico (PostgreSQL)
app.get("/actor/:id", async (req, res) => {
    try {
        const result = await db.query(query, [actorId]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).send("Actor no encontrado.");
        }

        const personData = {
            actor_id: actorId,
            actor_name: rows[0].person_name,
            gender: rows[0].gender,
            movies: [],
        };

        rows.forEach((row) => {
            personData.movies.push({
                title: row.title,
                movie_id: row.movie_id,
                character_name: row.character_name,
                release_date: row.release_date,
            });
        });

        res.render("actor", { personData });
        //const actorName = movies.length > 0 ? movies[0].actorname : ''; // Ojo: postgres devuelve todo en minúsculas por defecto
        //res.render('actor', { actorName, movies });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar las películas del actor.");
    }
});

// Ruta para mostrar la página de un director específico (PostgreSQL)
app.get("/director/:id", async (req, res) => {
    const directorId = req.params.id;

    const query = `
    SELECT DISTINCT
      person.person_name as directorName,
      movie.*
    FROM movie
    INNER JOIN movie_crew ON movie.movie_id = movie_crew.movie_id
    INNER JOIN person ON person.person_id = movie_crew.person_id
    WHERE movie_crew.job = 'Director' AND movie_crew.person_id = $1;
  `;

    try {
        const result = await db.query(query, [directorId]);
        const movies = result.rows;
        const directorName = movies.length > 0 ? movies[0].directorname : ""; // Ojo: postgres devuelve todo en minúsculas por defecto
        res.render("director", { directorName, movies });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar las películas del director.");
    }
});

app.listen(PORT, () =>
    console.log(`Servidor corriendo en http://localhost:${PORT}`),
);

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

        if (isPasswordCorrect) {
            res.send(`Bienvenido, ${user.username}!`);
        } else {
            res.send("Contraseña incorrecta");
        }

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

        res.send(`Usuario creado con éxito: ID = ${result.rows[0].id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al registrar el usuario (puede que el email ya exista)");
    }
});

