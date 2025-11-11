# Instructivo MongoDB
Este archivo está hecho porque soy muy buena onda y 
les hice los pasos para que setee rapido la parte del 
mongo que estoy empezando  
Aclaración si algún comando o dato esta mal es porque lo estoy haciendo de memoria

### Instalación
Tienen que ir a MongoDB Community Server Download  
https://www.mongodb.com/try/download/community
Ahí les aparece un zip para bajar y eso  
o sino los comandos para brew
Asegurense que les baje tambien el compass sino lo bajan aparte
(brew te da la opcion de tirar un comandito magico y bajarlo)

### Setup
1. No me acuerdo el comando, pero tienen que arrancar la base de datos de alguna forma  
(preguntenle al chat como era)
2. Después vayan a compass, hagan una nueva connection (llamenla como quieran)
3. Dentro de esa conection hagan una database que se llame movies

### Database
Una vez que tengan la conection hecha corran estos comanditos desde el cli de mongo  
(Vayan al path donde lo tienen instalado y corran `mongosh`)  
Cuando entren hagan `use movies` eso les debería meter a usar dicha base de datos que crearon antes  
Debería aparecerles así la terminal: `test>_`  
Ahí pueden modificar y jugar con la base de datos todo lo que quieran, total es local así q hagan lo que quieran  

### Collections
Para la parte de mongo, estuve pensando el diseño y concluí que hay q hacer una collection por evento  
Tonces, a continuación les paso los comandos para crear dichas colleciones con un input validator
así mantenemos un formato idéntico y no rompemos la página depues
(Se aceptan sugerencias para modificar cosas)
### reviews 

```  
db.createCollection("reviews", {
   validator: {
     $jsonSchema: {
       bsonType: "object",
        required: [
          "user_id",
          "username",
          "movie_id",
          "movie_title",
          "review",
          "created_at",
        ],
        properties: {
          user_id: { bsonType: "int", description: "Debe ser un número entero" },
          username: { bsonType: "string", description: "Nombre del usuario" },
          movie_id: { bsonType: "int", description: "ID de la película" },
          movie_title: { bsonType: "string", description: "Título de la película" },
          review: { bsonType: "string", description: "Texto de la reseña" },
          contains_spoiler: { bsonType: "bool", description: "Indica si contiene spoiler" },
          like: { bsonType: "int", description: "Cantidad de likes" },
          dislike: { bsonType: "int", description: "Cantidad de dislikes" },
          created_at: { bsonType: "date", description: "Fecha de creación" },
        }
      }
    }
  })
```

### rating
```
db.createCollection("rating", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "username", "movie_id", "movie_title", "score"],
      properties: {
        user_id: { bsonType: "int" },
        username: { bsonType: "string" },
        movie_id: { bsonType: "int" },
        movie_title: { bsonType: "string" },
        score: {
          bsonType: "int",
          minimum: 1,
          maximum: 10,
          description: "Debe estar entre 1 y 10"
        }
      }
    }
  }
})
```

### favorites
```
db.createCollection("favorites", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "movie_id", "movie_title"],
      properties: {
        user_id: { bsonType: "int" },
        movie_id: { bsonType: "int" },
        movie_title: { bsonType: "string" },
      }
    }
  }
})
```

### log
```
db.createCollection("user_log", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "event_type", "entity_id", "timestamp"],
      properties: {
        user_id: { bsonType: "int" },
        event_type: { bsonType: "string", description: "Tipo de evento (rating, review, favorite...)" },
        entity_id: { bsonType: "int", description: "ID de la entidad relacionada" },
        timestamp: { bsonType: "date", description: "Fecha y hora del evento" }
      }
    }
  }
})
```

### Modificar la de ratings
```
db.runCommand({
  collMod: "rating",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "movie_id", "movie_title", "score", "created_at"],
      properties: {
        user_id: { bsonType: "int" },
        movie_id: { bsonType: "int" },
        movie_title: { bsonType: "string" },
        score: {
          bsonType: "int",
          minimum: 1,
          maximum: 10,
          description: "Debe estar entre 1 y 10"
        },
        created_at: {
          bsonType: "date",
          description: "Fecha de creación del rating"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

```

Si te gusto este instructivo te pido si me podes ayudar😁  
Mi alias es: facugarciar

