DROP FUNCTION IF EXISTS search_all(text, integer, integer);

CREATE OR REPLACE FUNCTION search_all(p_search text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
    returns TABLE(id integer, name text, type text)
    stable
    language plpgsql
as
$$
BEGIN
    RETURN QUERY

    -- Películas
    SELECT mov.id, mov.name, mov.type FROM (
        SELECT
            m.movie_id::INT AS id,
            m.title::TEXT AS name,
            'movie'::TEXT AS type
        FROM movie m
        WHERE m.title ILIKE p_search
        ORDER BY m.popularity DESC NULLS LAST
        LIMIT p_limit OFFSET p_offset
    ) AS mov

    UNION ALL

    -- Actores
    SELECT act.id, act.name, act.type FROM (
        SELECT
            p.person_id::INT AS id,
            p.person_name::TEXT AS name,
            'actor'::TEXT AS type
        FROM person p
        JOIN movie_cast mc ON mc.person_id = p.person_id
        WHERE p.person_name ILIKE p_search
        GROUP BY p.person_id, p.person_name
        LIMIT p_limit OFFSET p_offset
    ) AS act

    UNION ALL

    -- Directores
    SELECT dir.id, dir.name, dir.type FROM (
        SELECT
            p.person_id::INT AS id,
            p.person_name::TEXT AS name,
            'director'::TEXT AS type
        FROM person p
        JOIN movie_crew mc ON mc.person_id = p.person_id
        JOIN department d ON d.department_id = mc.department_id
        WHERE p.person_name ILIKE p_search
          AND mc.job = 'Director'
        GROUP BY p.person_id, p.person_name
        ORDER BY p.person_name
        LIMIT p_limit OFFSET p_offset
    ) AS dir;
END;
$$;

COMMIT;
