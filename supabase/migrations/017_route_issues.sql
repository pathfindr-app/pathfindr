-- Private diagnostics inbox; anonymous and authenticated callers use the same bounded RPC.
create table if not exists public.route_issues (
  id uuid primary key,
  received_at timestamptz not null default now(),
  report jsonb not null check (octet_length(report::text) <= 2048)
);
alter table public.route_issues enable row level security;
create index if not exists route_issues_received_at on public.route_issues(received_at);
revoke all on public.route_issues from anon, authenticated;

create or replace function public.report_route_issues(reports jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare item jsonb;
begin
  if jsonb_typeof(reports) <> 'array' or jsonb_array_length(reports) > 10 then
    raise exception 'Invalid batch';
  end if;
  -- A global budget bounds anonymous abuse without fingerprinting visitors.
  perform pg_advisory_xact_lock(73241817);
  if (select count(*) from public.route_issues where received_at > now() - interval '1 minute') >= 600 then
    raise exception 'Diagnostic intake busy; retry later';
  end if;
  for item in select value from jsonb_array_elements(reports) loop
    if item->>'reason' not in ('assisted_finish','disconnected_graph')
       or octet_length(item::text) > 2048 then raise exception 'Invalid report'; end if;
    insert into public.route_issues(id,report) values ((item->>'id')::uuid,item)
    on conflict (id) do nothing;
  end loop;
end;
$$;
revoke all on function public.report_route_issues(jsonb) from public;
grant execute on function public.report_route_issues(jsonb) to anon, authenticated;
