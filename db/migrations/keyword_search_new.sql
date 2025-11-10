DROP FUNCTION IF EXISTS search_movies_by_keyword(text);

CREATE OR REPLACE FUNCTION search_movies_by_keyword(keyword_text TEXT)
RETURNS TABLE (
    movie_id INT,
    title VARCHAR(1000),
    overview VARCHAR(1000),
    release_date DATE,
    popularity NUMERIC
) AS $$
BEGIN
RETURN QUERY
SELECT DISTINCT
    m.movie_id,
    m.title,
    m.overview,
    m.release_date,
    m.popularity
FROM movies.movie m
         JOIN movies.movie_keywords mk ON m.movie_id = mk.movie_id
         JOIN movies.keyword k ON mk.keyword_id = k.keyword_id
WHERE k.keyword_name ILIKE '%' || keyword_text || '%'
ORDER BY m.popularity DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;