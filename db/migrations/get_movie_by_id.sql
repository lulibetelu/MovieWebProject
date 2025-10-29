DROP FUNCTION IF EXISTS get_movie_by_id(id INT);

CREATE OR REPLACE FUNCTION get_movie_by_id(id INT)
RETURNS TABLE (
    m_id INT,
    title VARCHAR,
    budget INT,
    homepage VARCHAR,
    overview VARCHAR,
    popularity NUMERIC,
    release_date DATE,
    revenue BIGINT,
    runtime INTEGER,
    movie_status VARCHAR(50),
    tagline VARCHAR(1000),
    vote_average NUMERIC(4,2),
    vote_count INT,
    country TEXT,
    genre TEXT,
    keywords TEXT,
    company TEXT,
    language TEXT,
    language_role TEXT
    ) as $$
    BEGIN
        RETURN QUERY
        SELECT
            m.*,
            STRING_AGG(DISTINCT c.country_name,','),
            STRING_AGG(DISTINCT g.genre_name,','),
            STRING_AGG(DISTINCT k.keyword_name, ','),
            STRING_AGG(DISTINCT production_company.company_name, ','),
            STRING_AGG(DISTINCT l.language_name, ','),
            STRING_AGG(DISTINCT lr.language_role, ',')

        FROM movie m
        LEFT JOIN movie_company mp on m.movie_id = mp.movie_id
        LEFT JOIN production_company  on mp.company_id = production_company.company_id
        LEFT JOIN production_country on m.movie_id = production_country.movie_id
        LEFT JOIN country c on production_country.country_id = c.country_id
        LEFT JOIN movie_genres mg on m.movie_id = mg.movie_id
        LEFT JOIN genre g on g.genre_id = mg.genre_id
        LEFT JOIN movie_keywords mk on m.movie_id = mk.movie_id
        LEFT JOIN keyword k on mk.keyword_id = k.keyword_id
        LEFT JOIN movie_languages ml on m.movie_id = ml.movie_id
        LEFT JOIN language l on ml.language_id = l.language_id
        LEFT JOIN language_role lr on ml.language_role_id = lr.role_id
        WHERE m.movie_id = id
        GROUP BY m.movie_id;
    END;
$$ LANGUAGE plpgsql;

COMMIT;
