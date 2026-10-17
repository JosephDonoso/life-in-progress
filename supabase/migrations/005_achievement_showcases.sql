-- Original catalog artwork and live rarity for explicitly featured achievements.
create function public.showcase_details(target_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 with population as(select count(*)::numeric n from public.profiles),
 selected as(select a.id,a.name,a.description,a.icon,a.created_at,a.translations,c.name category,
 case when p.n=0 then 0 else (select count(*) from public.user_achievements u where u.achievement_id=a.id)*100.0/p.n end percentage
 from public.featured_achievements f join public.achievements a on a.id=f.achievement_id
 join public.categories c on c.id=a.category_id join public.profiles owner on owner.id=f.user_id cross join population p
 where f.user_id=target_id and a.active and (owner.is_public or owner.id=auth.uid())),
 details as(select selected.*,(select r.name from public.rarity_thresholds r where selected.percentage>=r.minimum order by r.minimum desc limit 1) rarity from selected)
 select coalesce(jsonb_agg(to_jsonb(details) order by details.id),'[]'::jsonb) from details;
$$;
revoke execute on function public.showcase_details(uuid) from public,anon,authenticated;

create or replace function public.public_profile(target_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'avatar_url',p.avatar_url,'created_at',p.created_at,
 'unlocked',(select count(*) from public.user_achievements u join public.achievements a on a.id=u.achievement_id where u.user_id=p.id and a.active),
 'featured',public.showcase_details(p.id))
 from public.profiles p where p.id=target_id and (p.is_public or p.id=auth.uid());
$$;

-- Extend private state without changing its existing progress and aggregate fields.
alter function public.player_state() rename to player_state_without_showcase;
revoke execute on function public.player_state_without_showcase() from public,anon,authenticated;
create function public.player_state() returns jsonb language sql stable security definer set search_path='' as $$
 select public.player_state_without_showcase()||jsonb_build_object('featured_details',public.showcase_details(auth.uid()));
$$;
revoke execute on function public.player_state() from public;
grant execute on function public.player_state() to authenticated;
