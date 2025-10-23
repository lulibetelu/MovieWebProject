/*
 * Este archivo de ejecuto hacieno un `npm run migrate` y lo que hace es
 * modificar la base de datos con los cambios realizados en los archivos
 * SQL ubicados en la carpeta "db/migrations".
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const migrationsDir = path.resolve("./db/migrations");

require("dotenv").config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    options: `-c search_path=movies,public`, //modificar options de acuerdo al nombre del esquema
});

async function runMigrations() {
    await client.connect();

    const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    console.log("🟦 Ejecutando migraciones...");

    const res = await client.query("SELECT filename FROM migrations");
    const applied = res.rows.map((r) => r.filename);

    for (const file of files) {
        if (applied.includes(file)) continue;

        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        console.log(`➡️  Ejecutando: ${file}`);
        try {
            await client.query(sql);
            await client.query(
                "INSERT INTO migrations (filename) VALUES ($1)",
                [file],
            );
            console.log(`✅ ${file} aplicada con éxito.\n`);
        } catch (err) {
            console.error(`❌ Error en ${file}:`, err.message);
            break;
        }
    }

    await client.end();
    console.log("🏁 Migraciones completadas.");
}

runMigrations().catch(console.error);
