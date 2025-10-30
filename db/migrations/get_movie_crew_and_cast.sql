DROP FUNCTION IF EXISTS get_movie_crew_and_cast(id INT);
CREATE OR REPLACE FUNCTION get_movie_crew_and_cast(id INT)
    RETURNS TABLE(person_id integer,person_name varchar,character_name varchar,job varchar)
as $$
begin
return query
SELECT q.person_id,q.person_name,q.character_name,q.job
FROM
    ((select p.person_id,p.person_name,mc.character_name,'Actor' as job, cast_order
      from movie_cast mc
               join person p on mc.person_id = p.person_id
      where mc.movie_id = id
      order by cast_order)
     union all
     (select p.person_id,p.person_name,NULL as character_name,mc.job, NULL as cast_order
      from movie_crew mc
               join person p on mc.person_id = p.person_id
      where mc.movie_id = id)) q
ORDER BY (cast_order) ;
end;
$$ LANGUAGE plpgsql;
COMMIT;
