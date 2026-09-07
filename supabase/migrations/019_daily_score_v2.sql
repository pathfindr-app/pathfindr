-- Game only. Additive RPCs; existing challenge entries/history remain intact.
begin;
create or replace function public.challenge_points_v2(p_eff numeric,p_ms integer,p_data jsonb)
returns table(route_points integer,collection_points integer,speed_points integer,total_points integer)
language sql immutable set search_path=public as $$
 with pickups as (
   select distinct on (p->>'key') p->>'key' as key,p->>'type' as kind
   from jsonb_array_elements(case when jsonb_typeof(p_data->'collectibles')='array' then p_data->'collectibles' else '[]'::jsonb end) p
   where length(p->>'key') between 1 and 180 and p->>'type' in ('burger','library','landmark')
 ), parts as (
   select round(greatest(0,least(100,coalesce(p_eff,0)))*10)::integer r,
     least(200,coalesce((select sum(case kind when 'burger' then 25 when 'library' then 40 when 'landmark' then 60 else 0 end) from pickups),0))::integer c,
     case when p_ms>0 then round(100::numeric/(1+p_ms::numeric/60000))::integer else 0 end s
 ) select r,c,s,r+c+s from parts;
$$;
create or replace function public.get_challenge_leaderboard_v2(p_challenge_id uuid,p_limit integer default 100)
returns table(rank integer,user_id uuid,username text,efficiency numeric,duration_ms integer,submitted_at timestamptz,collection_points integer,speed_points integer,total_points integer)
language sql stable set search_path=public as $$
 select row_number() over(order by s.total_points desc,ce.duration_ms asc nulls last,ce.submitted_at,ce.user_id)::integer,
 ce.user_id,ce.username,ce.efficiency,ce.duration_ms,ce.submitted_at,s.collection_points,s.speed_points,s.total_points
 from challenge_entries ce cross join lateral challenge_points_v2(ce.efficiency,ce.duration_ms,ce.path_data) s
 where ce.challenge_id=p_challenge_id
 order by s.total_points desc,ce.duration_ms asc nulls last,ce.submitted_at,ce.user_id limit greatest(1,least(100,p_limit));
$$;
create or replace function public.submit_challenge_entry_v2(p_challenge_id uuid,p_user_id uuid,p_username text,p_efficiency numeric,p_path_data jsonb,p_duration_ms integer)
returns table(is_improvement boolean,previous_efficiency numeric,new_rank integer)
language plpgsql set search_path=public as $$
declare old_entry challenge_entries%rowtype;old_total integer;new_total integer;improved boolean;result_rank integer;
begin
 if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'Authenticated player mismatch';end if;
 if p_efficiency is null or p_efficiency<0 or p_efficiency>100 or p_efficiency='NaN'::numeric or p_duration_ms is null or p_duration_ms<0 or p_duration_ms>86400000 then raise exception 'Invalid round metrics';end if;
 if jsonb_typeof(p_path_data) is distinct from 'object' or octet_length(p_path_data::text)>1000000 then raise exception 'Invalid route data';end if;
 if not exists(select 1 from challenges where id=p_challenge_id and challenge_type='daily' and now() between active_from and active_until) then raise exception 'Daily challenge is not active';end if;
 -- Serialize retries for the same player/challenge; no duplicate attempt records.
 perform pg_advisory_xact_lock(hashtextextended(p_challenge_id::text||p_user_id::text,0));
 select * into old_entry from challenge_entries where challenge_id=p_challenge_id and user_id=p_user_id;
 select total_points into new_total from challenge_points_v2(p_efficiency,p_duration_ms,p_path_data);
 select total_points into old_total from challenge_points_v2(old_entry.efficiency,old_entry.duration_ms,old_entry.path_data);
 improved:=old_entry.user_id is null or new_total>old_total or (new_total=old_total and p_duration_ms<old_entry.duration_ms);
 if improved then
   insert into challenge_entries(challenge_id,user_id,username,efficiency,path_data,duration_ms)
   values(p_challenge_id,p_user_id,left(p_username,80),p_efficiency,p_path_data||jsonb_build_object('scoreVersion',2),p_duration_ms)
   on conflict(challenge_id,user_id) do update set efficiency=excluded.efficiency,path_data=excluded.path_data,duration_ms=excluded.duration_ms,submitted_at=now();
 end if;
 select ranked.rank into result_rank from (
   select ce.user_id,row_number() over(order by s.total_points desc,ce.duration_ms asc nulls last,ce.submitted_at,ce.user_id)::integer rank
   from challenge_entries ce cross join lateral challenge_points_v2(ce.efficiency,ce.duration_ms,ce.path_data) s where ce.challenge_id=p_challenge_id
 ) ranked where ranked.user_id=p_user_id;
 return query select improved,old_entry.efficiency,result_rank;
end;$$;
revoke all on function public.submit_challenge_entry_v2(uuid,uuid,text,numeric,jsonb,integer) from public,anon;
grant execute on function public.submit_challenge_entry_v2(uuid,uuid,text,numeric,jsonb,integer) to authenticated;
grant execute on function public.get_challenge_leaderboard_v2(uuid,integer) to anon,authenticated;
-- Close the existing identity-spoofing INSERT policy; old logged-in clients still work.
drop policy if exists "Anyone can insert challenge entries" on public.challenge_entries;
drop policy if exists "Players insert their own challenge entries" on public.challenge_entries;
create policy "Players insert their own challenge entries" on public.challenge_entries for insert to authenticated with check(auth.uid()=user_id);
notify pgrst,'reload schema';
commit;
