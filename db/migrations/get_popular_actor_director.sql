DROP FUNCTION IF EXISTS get_top_directors(p_limit INTEGER);
DROP FUNCTION IF EXISTS get_top_actors(p_limit INTEGER);

create function get_top_directors(p_limit integer)
    returns TABLE(person_id integer, person_name character varying, movie_count bigint, weighted_popularity numeric)
    language plpgsql
as
$$
BEGIN
    RETURN QUERY
    SELECT
        p.person_id,
        p.person_name,
        count(*) as movie_count,
        (SUM(m.popularity) * 0.8 / count(*)) * count(*) as weighted_popularity
    FROM person p
    FULL JOIN movies.movie_crew mc ON p.person_id = mc.person_id
    JOIN movies.movie m ON mc.movie_id = m.movie_id
    WHERE mc.job = 'Director'
    GROUP BY p.person_id, p.person_name
    ORDER BY weighted_popularity DESC
    LIMIT p_limit;
END;
$$;

alter function get_top_directors(integer) owner to postgres;

create function get_top_actors(p_limit integer)
    returns TABLE(person_id integer, person_name character varying, movie_count bigint, weighted_popularity numeric)
    language plpgsql
as
$$
BEGIN
    RETURN QUERY
    SELECT
        p.person_id,
        p.person_name,
        count(*) as movie_count,
        (SUM(m.popularity) * 0.8 / count(*)) * count(*) as weighted_popularity
    FROM person p
    FULL JOIN movies.movie_cast mc ON p.person_id = mc.person_id
    JOIN movies.movie m ON mc.movie_id = m.movie_id
    GROUP BY p.person_id, p.person_name
    ORDER BY weighted_popularity DESC
    LIMIT p_limit;
END;
$$;

alter function get_top_actors(integer) owner to postgres;
