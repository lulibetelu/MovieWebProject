DROP FUNCTION if exists get_top_movies_by_genre(integer);

create function get_top_movies_by_genre(limit_per_genre integer DEFAULT 5)
    returns TABLE(id integer, genre_name text, title text, popularity numeric)
    language sql
as
$$
    SELECT movie_id as id, genre_name, title, popularity
    FROM (
        SELECT
            m.movie_id,
            g.genre_name AS genre_name,
            m.title,
            m.popularity,
            ROW_NUMBER() OVER (
                PARTITION BY g.genre_id
                ORDER BY m.popularity DESC
            ) AS rank
        FROM movie m
        JOIN movie_genres mg ON m.movie_id = mg.movie_id
        JOIN genre g ON g.genre_id = mg.genre_id
    ) ranked
    WHERE rank <= limit_per_genre
    ORDER BY genre_name, popularity DESC;
$$;

alter function get_top_movies_by_genre(integer) owner to postgres;
