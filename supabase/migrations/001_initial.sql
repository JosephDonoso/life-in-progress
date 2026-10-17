create extension if not exists pg_trgm;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null default 'Explorador', avatar_url text,
 is_public boolean not null default false, created_at timestamptz not null default now()
);
create table public.categories(id bigint generated always as identity primary key, name text unique not null);
create table public.achievements(
 id uuid primary key default gen_random_uuid(), name text not null unique,
 description text not null, icon text not null default '🏆', image_url text,
 category_id bigint not null references public.categories,
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.user_achievements(
 user_id uuid references public.profiles on delete cascade,
 achievement_id uuid references public.achievements on delete cascade,
 unlocked_at timestamptz not null default now(), primary key(user_id,achievement_id)
);
create table public.featured_achievements(
 user_id uuid, achievement_id uuid,
 primary key(user_id,achievement_id),
 foreign key(user_id,achievement_id) references public.user_achievements on delete cascade
);
create table public.rarity_thresholds(name text primary key, minimum numeric unique not null check(minimum between 0 and 100));
insert into public.rarity_thresholds values ('Común',50),('Raro',15),('Súper raro',5),('Épico',1),('Legendario',0);
create index achievements_category on public.achievements(category_id) where active;
create index achievements_search on public.achievements using gin ((name || ' ' || description) gin_trgm_ops);
create index unlocks_achievement on public.user_achievements(achievement_id);
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.featured_achievements enable row level security;
alter table public.rarity_thresholds enable row level security;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy categories_read on public.categories for select using(true);
create policy achievements_read on public.achievements for select using(active);
create policy thresholds_read on public.rarity_thresholds for select using(true);
create policy own_unlocks_read on public.user_achievements for select to authenticated using(user_id=auth.uid());
create policy own_unlocks_insert on public.user_achievements for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.achievements where id=achievement_id and active));
create policy own_unlocks_update on public.user_achievements for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.achievements where id=achievement_id and active));
create policy own_unlocks_delete on public.user_achievements for delete to authenticated using(user_id=auth.uid());
create policy own_featured_read on public.featured_achievements for select to authenticated using(user_id=auth.uid());
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,avatar_url) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Explorador'),new.raw_user_meta_data->>'avatar_url');
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public;
create function public.global_stats() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('achievements',(select count(*) from public.achievements where active),'players',(select count(*) from public.profiles),'unlocks',(select count(*) from public.user_achievements u join public.achievements a on a.id=u.achievement_id where a.active));
$$;
create function public.catalog_page(search_text text default '',category_name text default '',rarity_name text default '',state_filter text default 'all',sort_order text default 'popular',page_number int default 0)
returns jsonb language sql stable security definer set search_path='' as $$
 with population as(select count(*)::numeric n from public.profiles),
 counts as(select achievement_id,count(*) n from public.user_achievements group by achievement_id),
 catalog as(select a.id,a.name,a.description,a.icon,c.name category,a.created_at,
 case when p.n=0 then 0 else coalesce(u.n,0)*100.0/p.n end percentage
 from public.achievements a join public.categories c on c.id=a.category_id cross join population p left join counts u on u.achievement_id=a.id
 where a.active and (search_text='' or (a.name||' '||a.description) ilike '%'||left(search_text,200)||'%') and (category_name='' or c.name=category_name)
 and (state_filter='all' or (state_filter='unlocked' and exists(select 1 from public.user_achievements x where x.user_id=auth.uid() and x.achievement_id=a.id)) or (state_filter='locked' and not exists(select 1 from public.user_achievements x where x.user_id=auth.uid() and x.achievement_id=a.id)))),
 filtered as(select * from catalog x where rarity_name='' or rarity_name=(select r.name from public.rarity_thresholds r where x.percentage>=r.minimum order by r.minimum desc limit 1)),
 paged as(select *, (select r.name from public.rarity_thresholds r where filtered.percentage>=r.minimum order by r.minimum desc limit 1) rarity from filtered order by
 case when sort_order='catalog' then created_at end asc,
 case when sort_order='name' then name end asc,
 case when sort_order='new' then created_at end desc,
 case when sort_order='rare' then percentage end asc,
 case when sort_order not in ('name','new','rare','catalog') then percentage end desc,id
 limit 12 offset greatest(0,least(page_number,100000))*12)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb),'total',(select count(*) from filtered));
$$;
create function public.update_profile(public_profile boolean,favorites uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if coalesce(array_length(favorites,1),0)>3 then raise exception 'Maximum three favorites'; end if;
 update public.profiles set is_public=public_profile where id=auth.uid();
 delete from public.featured_achievements where user_id=auth.uid();
 insert into public.featured_achievements(user_id,achievement_id) select auth.uid(),unnest(favorites);
end; $$;
revoke execute on function public.update_profile(boolean,uuid[]) from public;
grant execute on function public.update_profile(boolean,uuid[]) to authenticated;
grant execute on function public.catalog_page(text,text,text,text,text,int),public.global_stats() to anon,authenticated;
-- External identities and sessions are managed by Supabase Auth (auth.identities).
create function public.player_state() returns jsonb language sql stable security definer set search_path='' as $$
 with population as(select count(*)::numeric n from public.profiles),
 counts as(select achievement_id,count(*) n from public.user_achievements group by achievement_id),
 mine as(select a.id,a.name,a.category_id,case when p.n=0 then 0 else coalesce(c.n,0)*100.0/p.n end percentage
 from public.user_achievements u join public.achievements a on a.id=u.achievement_id cross join population p left join counts c on c.achievement_id=a.id where u.user_id=auth.uid() and a.active),
 distribution as(select r.name,count(m.id) total from public.rarity_thresholds r left join mine m on r.name=(select t.name from public.rarity_thresholds t where m.percentage>=t.minimum order by t.minimum desc limit 1) group by r.name),
 category_progress as(select c.name,(select count(*) from public.achievements a where a.category_id=c.id and a.active) total,(select count(*) from mine m where m.category_id=c.id) unlocked from public.categories c)
 select jsonb_build_object(
 'unlocked',coalesce((select jsonb_agg(id) from mine),'[]'::jsonb),
 'featured',coalesce((select jsonb_agg(f.achievement_id) from public.featured_achievements f join mine m on m.id=f.achievement_id where f.user_id=auth.uid()),'[]'::jsonb),
 'public',coalesce((select is_public from public.profiles where id=auth.uid()),false),
 'distribution',(select jsonb_object_agg(name,total) from distribution),
 'categories',coalesce((select jsonb_agg(to_jsonb(category_progress)) from category_progress),'[]'::jsonb),
 'rarest',(select jsonb_build_object('name',name,'percentage',percentage) from mine order by percentage,id limit 1),
 'featured_names',coalesce((select jsonb_object_agg(m.id,m.name) from mine m join public.featured_achievements f on f.achievement_id=m.id and f.user_id=auth.uid()),'{}'::jsonb));
$$;
revoke execute on function public.player_state() from public;
grant execute on function public.player_state() to authenticated;
