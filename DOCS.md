# 🎬 MovieWebProject — Guía de instalación

Guía completa para levantar el proyecto frontend + backend, configurar las variables de entorno y preparar la base de datos.

## 📖 Índice

1. [🚀 Comandos principales](#-comandos-principales-post-instalación)
2. [⚙️ Instalación paso a paso](#-instalación-paso-a-paso)
3. [🧠 Configuración del Backend](#-configuración-del-backend)
4. [🎨 Configuración del Frontend](#-configuración-del-frontend)
5. [🗄️ Base de Datos SQL (PostgreSQL)](#-base-de-datos-sql-postgresql)
6. [☁️ Base de Datos NoSQL (MongoDB)](#-base-de-datos-nosql-mongodb)
7. [🧩 Estructura del proyecto](#-estructura-del-proyecto)
8. [💡 Tips finales](#-tips-finales)
9. [🛠️ Stack Tecnológico](#-stack-tecnológico)


## 🚀 Comandos principales (post instalación)

Ejecutar todo el proyecto (frontend + backend):
```bash
npm run dev:all
```

Migrar la base de datos (SQL):
```bash
npm run migrate
```

Ejecutar sólo el cliente (Astro):
```bash
npm run dev:client
```

Ejecutar sólo el servidor (Express):
```bash
npm run dev:server
```

## ⚙️ Instalación paso a paso

1️⃣ Clonar el repositorio
```bash
git clone https://github.com/lulibetelu/MovieWebProject.git
```

2️⃣ Instalar las dependencias
```bash
cd MovieWebProject
npm install          # Dependencias del root
cd client && npm install   # Dependencias del frontend
cd ../server && npm install  # Dependencias del backend
cd ..
```
> 💡 Es importante instalar tanto las dependencias del root como las del cliente y servidor.

## 🧠 Configuración del Backend

📍 Ubicación: `/server`

Configurar las variables de entorno del __servidor__:
   - Moverse a la carpeta `/server`.
   - Copiar el archivo `.env.example` a `.env`.
   - Configurar las variables:
     - `PORT`: Puerto en el que se ejecutará el servidor (API).
     - `DB_HOST`: Host de la base de datos.
     - `DB_USER`: Usuario de la base de datos.
     - `DB_PASSWORD`: Contraseña de la base de datos.
     - `DB_PORT`: Puerto de la base de datos.
     - `DEBUG`: Modo de depuración (true/false).
     - `API_MODE`: Modo API o RENDER (true).
     - `SECRET_KEY`: Clave secreta para la aplicación. (texto random)
     - `TMDB_API_KEY`: 🔑 Clave de API para la API de The Movie Database. (Crearse una cuenta en [TMDB](https://www.themoviedb.org/) y poner la api key)

Mas información sobre `server` en [README](README.md).

## 🎨 Configuración de Frontend

📍 Ubicación: `/client`

Configurar las variables de entorno del __cliente__:
   - Moverse a la carpeta `/client`.
   - Copiar el archivo `.env.example` a `.env`.
   - Configurar las variables:
     - `PUBLIC_TMDB_API_KEY`: 🔑 Misma que en el `server`.
     - `PUBLIC_API_URL`: ruta al servidor (`http://localhost:3500/api`)
     - `NLPCLOUD_TOKEN`: 🔑 Crearse una cuenta en [NLPCloud](https://nlpcloud.com/) y poner el token

Mas información sobre `client` en [README](./client/README.md).

## 🗄️ Configuración de Base de Datos SQL (PostgreSQL)

📍 Ubicación: `/db`

Correr los scripts de la carpeta en orden para modificar la base de datos local.
### Primera vez

- Ejecutar los __12 scripts base__ del profesor.
- Ejecutar el script 13 `/db/13_migration_table.sql`

### Despues de cada __git pull__

Ejecutar el comando `npm run migrate` (desde root) para actualizar la base de datos.

Mas información sobre `db` en [instrucciones](./db/instrucciones.txt).

## Configuración de Base de Datos NoSQL (MongoDB)

🚧 Próximamente…
La integración con MongoDB se encuentra en desarrollo.

## 🧩 Estructura del proyecto
```sh
MovieWebProject/
│
├── client/          → Frontend (Astro)
│   ├── src/
│   ├── public/
│   └── .env
│
├── server/          → Backend (Express + PostgreSQL)
│   ├── src/
│   ├── db/
│   └── .env
│
├── db/              → Scripts SQL
├── package.json     → Scripts globales
└── README.md
```

## 💡 Tips finales

- 📦 Antes de correr npm run dev:all, asegurate de que PostgreSQL esté levantado.
- 🧠 Si hay errores de conexión, revisá las rutas de las variables .env.
- 🔥 El resumen automático de reseñas usa la API /api/summarize (NLPCloud).

## 🛠️ Stack Tecnológico

- Frontend: Astro, Tailwind CSS
- Backend: Express, Node.js
- Base de datos SQL: PostgreSQL
- Base de datos NoSQL: MongoDB (próximamente)
- APIs externas: TMDB, NLPCloud
