create table if not exists public.achievements (
  id text primary key,
  number text not null,
  title jsonb not null default '["",""]'::jsonb,
  description text not null default '',
  meta jsonb not null default '[]'::jsonb,
  image text,
  sort_order int not null default 0
);

alter table public.achievements enable row level security;

do $$
begin
  create policy "read achievements" on public.achievements
    for select using (true);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "insert achievements" on public.achievements
    for insert with check (true);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "update achievements" on public.achievements
    for update using (true);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create policy "delete achievements" on public.achievements
    for delete using (true);
exception
  when duplicate_object then null;
end
$$;
