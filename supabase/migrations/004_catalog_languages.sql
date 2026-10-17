alter table public.achievements add column translations jsonb not null default '{}'::jsonb;
drop function public.catalog_page(text,text,text,text,text,int);
create function public.catalog_page(search_text text default '',category_name text default '',rarity_name text default '',state_filter text default 'all',sort_order text default 'popular',page_number int default 0,locale_language text default 'es')
returns jsonb language sql stable security definer set search_path='' as $$
 with population as(select count(*)::numeric n from public.profiles),
 counts as(select achievement_id,count(*) n from public.user_achievements group by achievement_id),
 catalog as(select a.id,case when locale_language='en' then coalesce(a.translations->'en'->>'name',a.name) else a.name end name,case when locale_language='en' then coalesce(a.translations->'en'->>'description',a.description) else a.description end description,a.icon,c.name category,a.created_at,
 case when p.n=0 then 0 else coalesce(u.n,0)*100.0/p.n end percentage
 from public.achievements a join public.categories c on c.id=a.category_id cross join population p left join counts u on u.achievement_id=a.id
 where a.active and (search_text='' or (a.name||' '||a.description||' '||coalesce(a.translations->'en'->>'name','')||' '||coalesce(a.translations->'en'->>'description','')) ilike '%'||left(search_text,200)||'%') and (category_name='' or c.name=category_name)
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

revoke execute on function public.catalog_page(text,text,text,text,text,int,text) from public;
grant execute on function public.catalog_page(text,text,text,text,text,int,text) to anon,authenticated;
