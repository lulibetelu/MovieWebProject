# Paso a paso para levantar Movie Web App!!

### Dependencias
1. Apenas se descarga el archivo correr
   `npm install`
2. Luego entrar a server `cd server` y ejecutar `npm install`
3. Lo mismo para client `cd client` y `npm install` (si por alugna razon se queda colgado un tiempo cortarlo CTRL + C y ejecutar de vuelta, de todas formas va a tardar)
4. Esto lo hacemos porque separamos el proyecto de dos servidores (el front en localhost:4321 y el back en localhost:3500 y cada uno tiene sus dependencias)

### Variables de entorno

4. Dentro de las carpeta server crear un archivo .env con este contenido
```
DB_USER=postgres
DB_PASSWORD=1234
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=movies
TMDB_API_KEY=<insertar clave API tmdb>
SECRET_KEY=hola
API_MODE="true"
PUBLIC_TMDB_API_KEY=<insertar clave API tmdb>
PUBLIC_API_URL="http://localhost:3500/api"
```
5. Dentro de la carpeta client crear un archivo .env con este contenido:
```
PUBLIC_TMDB_API_KEY="<insertar clave API tmdb>"
PUBLIC_API_URL="http://localhost:3500/api"
```

### Migrations
6. Con las variables de entorno definidas y la base de datos posgres prendida, desde el root del proyecto correr `npm run migrate`
7. Deberia correr todas las migraciones y devolver 🟦 Ejecutando migraciones...
   🏁 Migraciones completadas.
8. Si llega a no andar se pueden correr una por una desde Datagrip

### Mongo
9. Ejecutar lo que esta en el instructivo de mongo `/mdb/MongoDB.md`

### Ejecutar proyecto
10. Una vez que este todo hecho ya deberia estar en condiciones de correr
11. El comando es `npm run dev:all`
12. Conectarse al localhost:4321 donde esta el frontend



