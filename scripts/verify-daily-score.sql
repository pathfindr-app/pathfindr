-- Transactional fixtures only: no persistent players, challenges or scores.
begin;
insert into auth.users(id,aud,role,created_at,updated_at) values('bc74a267-99be-4c6b-85a2-f4799b41ab42','authenticated','authenticated',now(),now());
insert into public.challenges(id,challenge_type,city_name,center_lat,center_lng,start_lat,start_lng,end_lat,end_lng,active_from,active_until)
values('8318a293-5a66-439d-aa78-21c361fe4a42','daily','Transactional QA',0,0,0,0,.001,.001,now()-interval '1 minute',now()+interval '1 hour');
set local role authenticated;
set local request.jwt.claim.sub='bc74a267-99be-4c6b-85a2-f4799b41ab42';
do $$ declare s record;r record;begin
 select * into s from public.challenge_points_v2(90,60000,'{"collectibles":[{"key":"a","type":"library"},{"key":"a","type":"library"},{"key":"b","type":"fake"}]}');
 if s.total_points<>990 or s.collection_points<>40 or s.speed_points<>50 then raise exception 'Scoring/dedup failed';end if;
 select * into r from public.submit_challenge_entry_v2('8318a293-5a66-439d-aa78-21c361fe4a42','bc74a267-99be-4c6b-85a2-f4799b41ab42','QA',90,'{"collectibles":[]}',60000);
 if r.new_rank<>1 or not r.is_improvement then raise exception 'First submission failed';end if;
 select * into r from public.submit_challenge_entry_v2('8318a293-5a66-439d-aa78-21c361fe4a42','bc74a267-99be-4c6b-85a2-f4799b41ab42','QA',89,'{"collectibles":[{"key":"a","type":"library"}]}',60000);
 if not r.is_improvement then raise exception 'Weighted improvement failed';end if;
 select * into s from public.get_challenge_leaderboard_v2('8318a293-5a66-439d-aa78-21c361fe4a42');
 if s.total_points<>980 or s.collection_points<>40 then raise exception 'Stored score mismatch';end if;
 begin
 perform public.submit_challenge_entry_v2('8318a293-5a66-439d-aa78-21c361fe4a42','11111111-1111-1111-1111-111111111111','QA',100,'{}',1000);
 raise exception 'Spoof accepted';
 exception when others then if sqlerrm<>'Authenticated player mismatch' then raise;end if;end;
end $$;
rollback;
