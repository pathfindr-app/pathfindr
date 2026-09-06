-- Private cloud library + immutable, unlisted friend shares. No ranked-score writes.
begin;
create table public.route_runs (
  id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pinned boolean not null default false,
  payload jsonb not null check (octet_length(payload::text) <= 4000000),
  primary key(owner_id,id)
);
create table public.route_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  revoked boolean not null default false,
  payload jsonb not null check (octet_length(payload::text) <= 4000000),
  unique(owner_id,request_id)
);
alter table public.route_runs enable row level security;
alter table public.route_shares enable row level security;
revoke all on public.route_runs,public.route_shares from anon,authenticated;
grant select,delete on public.route_runs to authenticated;
grant select on public.route_shares to authenticated;
create policy "Read own saved runs" on public.route_runs for select to authenticated using ((select auth.uid())=owner_id);
create policy "Delete own saved runs" on public.route_runs for delete to authenticated using ((select auth.uid())=owner_id);
create policy "Read own shares" on public.route_shares for select to authenticated using ((select auth.uid())=owner_id);

create function public.save_route_run(p_id uuid,p_payload jsonb,p_pinned boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Sign in to save routes across devices'; end if;
  if p_payload is null or p_payload->>'v' is distinct from '1' or p_payload->>'kind' is distinct from 'result'
    or jsonb_typeof(p_payload->'rounds') is distinct from 'array' or jsonb_typeof(p_payload->'maps') is distinct from 'array'
    or octet_length(p_payload::text)>4000000 then raise exception 'Invalid route record'; end if;
  if jsonb_array_length(p_payload->'rounds') not between 1 and 5 or jsonb_array_length(p_payload->'maps') not between 1 and 5 then raise exception 'Invalid run length'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if not exists(select 1 from public.route_runs where owner_id=uid and id=p_id)
     and (select count(*) from public.route_runs where owner_id=uid)>=100 then raise exception 'Cloud library is full (100 runs). Export or remove older runs.'; end if;
  insert into public.route_runs(id,owner_id,payload,pinned) values(p_id,uid,p_payload,p_pinned)
  on conflict(owner_id,id) do update set payload=excluded.payload,pinned=public.route_runs.pinned or excluded.pinned,updated_at=now();
  return p_id;
end $$;

create function public.publish_route_share(p_request_id uuid,p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); existing uuid; share_payload jsonb:=p_payload; cleaned jsonb;
begin
  if uid is null then raise exception 'Sign in to publish a hosted link'; end if;
  if p_payload is null or p_payload->>'v' is distinct from '1' or coalesce(p_payload->>'kind','') not in ('result','challenge')
    or jsonb_typeof(p_payload->'rounds') is distinct from 'array' or jsonb_typeof(p_payload->'maps') is distinct from 'array'
    or octet_length(p_payload::text)>4000000 then raise exception 'Invalid share'; end if;
  if jsonb_array_length(p_payload->'rounds') not between 1 and 5 or jsonb_array_length(p_payload->'maps') not between 1 and 5 then raise exception 'Invalid run length'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  select id into existing from public.route_shares where owner_id=uid and request_id=p_request_id;
  if found then return existing; end if;
  if (select count(*) from public.route_shares where owner_id=uid and created_at>now()-interval '1 day')>=20 then raise exception 'Daily share limit reached. Try again tomorrow.'; end if;
  if (select count(*) from public.route_shares where owner_id=uid)>=500 then raise exception 'Hosted share limit reached.'; end if;
  -- Withhold solution fields server-side as well as in the client.
  if p_payload->>'kind'='challenge' then
    select jsonb_agg(jsonb_build_object('map',r->'map','start',r->'start','end',r->'end','difficulty',r->'difficulty','pickups',r->'pickups') order by ordinal)
      into cleaned from jsonb_array_elements(p_payload->'rounds') with ordinality as rounds(r,ordinal);
    share_payload=jsonb_build_object('v',1,'kind','challenge','title',p_payload->'title','maps',p_payload->'maps','rounds',cleaned);
  end if;
  insert into public.route_shares(owner_id,request_id,payload) values(uid,p_request_id,share_payload) returning id into existing;
  return existing;
end $$;

-- Lookup-only access: guests cannot enumerate the share table or read ownership.
create function public.get_route_share(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select payload from public.route_shares where id=p_id and not revoked;
$$;
create function public.revoke_route_share(p_id uuid) returns void language sql security definer set search_path='' as $$
  update public.route_shares set revoked=true where id=p_id and owner_id=auth.uid();
$$;
revoke all on function public.save_route_run(uuid,jsonb,boolean),public.publish_route_share(uuid,jsonb),public.get_route_share(uuid),public.revoke_route_share(uuid) from public;
grant execute on function public.save_route_run(uuid,jsonb,boolean),public.publish_route_share(uuid,jsonb),public.revoke_route_share(uuid) to authenticated;
grant execute on function public.get_route_share(uuid) to anon,authenticated;
commit;
