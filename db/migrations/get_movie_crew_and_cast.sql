DROP FUNCTION IF EXISTS get_movie_crew_and_cast(id INT);
CREATE OR REPLACE FUNCTION get_movie_crew_and_cast(id INT)
    RETURNS TABLE(person_id integer,person_name varchar,character_name varchar,job varchar)
as $$
begin
    return query
        (select p.person_id,p.person_name,mc.character_name,'Actor' as job
         from movie_cast mc
                  join person p on mc.person_id = p.person_id
         where mc.movie_id = id
         order by cast_order)
        union
        (select p.person_id,p.person_name,NULL as character_name,mc.job
         from movie_crew mc
                  join person p on mc.person_id = p.person_id
         where mc.movie_id = id);
end;
$$ LANGUAGE plpgsql;

COMMIT;
