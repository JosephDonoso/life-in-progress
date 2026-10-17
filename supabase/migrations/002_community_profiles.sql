-- Four dynamic rarity bands: common >=50%, rare >=5%, epic >=1%, legendary <1%.
delete from public.rarity_thresholds where name='Súper raro';
update public.rarity_thresholds set minimum=5 where name='Raro';

create function public.edit_profile(new_name text,new_avatar text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(trim(new_name)) not between 2 and 40 then raise exception 'Invalid display name'; end if;
 if new_avatar is not null and (length(new_avatar)>2048 or new_avatar !~ '^https://') then raise exception 'Invalid avatar URL'; end if;
 update public.profiles set display_name=trim(new_name),avatar_url=new_avatar where id=auth.uid();
end; $$;
revoke execute on function public.edit_profile(text,text) from public;
grant execute on function public.edit_profile(text,text) to authenticated;

create table public.friendships(
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles on delete cascade,
 recipient_id uuid not null references public.profiles on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 check(requester_id<>recipient_id)
);
create unique index friendship_pair on public.friendships(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
create index friendship_recipient on public.friendships(recipient_id,status);
create index friendship_requester on public.friendships(requester_id,status);
alter table public.friendships enable row level security;
create policy friendship_participants on public.friendships for select to authenticated using(auth.uid() in (requester_id,recipient_id));

create function public.friendship_action(target_id uuid,action_name text) returns void language plpgsql security definer set search_path='' as $$
declare current_friend public.friendships;
begin
 if auth.uid() is null or auth.uid()=target_id then raise exception 'Invalid user'; end if;
 select * into current_friend from public.friendships where least(requester_id,recipient_id)=least(auth.uid(),target_id) and greatest(requester_id,recipient_id)=greatest(auth.uid(),target_id) for update;
 if action_name='request' then
   if not exists(select 1 from public.profiles where id=target_id and is_public) then raise exception 'Profile unavailable'; end if;
   insert into public.friendships(requester_id,recipient_id) values(auth.uid(),target_id) on conflict do nothing;
 elsif action_name='accept' then
   if current_friend.recipient_id is distinct from auth.uid() or current_friend.status<>'pending' then raise exception 'Invalid request'; end if;
   update public.friendships set status='accepted' where id=current_friend.id;
 elsif action_name in ('decline','cancel','remove') then
   if current_friend.id is null then return; end if;
   if action_name='decline' and (current_friend.recipient_id<>auth.uid() or current_friend.status<>'pending') then raise exception 'Invalid request'; end if;
   if action_name='cancel' and (current_friend.requester_id<>auth.uid() or current_friend.status<>'pending') then raise exception 'Invalid request'; end if;
   if action_name='remove' and current_friend.status<>'accepted' then raise exception 'Invalid request'; end if;
   delete from public.friendships where id=current_friend.id;
 else raise exception 'Invalid action'; end if;
end; $$;
revoke execute on function public.friendship_action(uuid,text) from public;
grant execute on function public.friendship_action(uuid,text) to authenticated;

create function public.community_profiles(search_text text default '',list_filter text default 'all',page_number int default 0) returns jsonb language sql stable security definer set search_path='' as $$
 with directory as (
 select p.id,p.is_public,
 case when p.is_public then p.display_name else 'Perfil privado' end display_name,
 case when p.is_public then p.avatar_url else null end avatar_url,
 case when p.is_public then (select count(*) from public.user_achievements u join public.achievements a on a.id=u.achievement_id where u.user_id=p.id and a.active) else null end unlocked,
 case when f.status='accepted' then 'friends' when f.requester_id=auth.uid() then 'outgoing' when f.recipient_id=auth.uid() then 'incoming' else 'none' end relationship
 from public.profiles p left join public.friendships f on (f.requester_id=auth.uid() and f.recipient_id=p.id) or (f.recipient_id=auth.uid() and f.requester_id=p.id)
 where p.id is distinct from auth.uid() and (p.is_public or f.id is not null)),
 filtered as(select * from directory where (search_text='' or display_name ilike '%'||left(search_text,80)||'%') and ((list_filter='all' and is_public) or (list_filter='friends' and relationship='friends') or (list_filter='requests' and relationship in ('incoming','outgoing')))),
 paged as(select * from filtered order by display_name,id limit 12 offset greatest(0,least(page_number,100000))*12)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb),'total',(select count(*) from filtered));
$$;
revoke execute on function public.community_profiles(text,text,int) from public;
grant execute on function public.community_profiles(text,text,int) to anon,authenticated;

create function public.public_profile(target_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'avatar_url',p.avatar_url,'created_at',p.created_at,
 'unlocked',(select count(*) from public.user_achievements u join public.achievements a on a.id=u.achievement_id where u.user_id=p.id and a.active),
 'featured',coalesce((select jsonb_agg(jsonb_build_object('name',a.name,'icon',a.icon)) from public.featured_achievements f join public.achievements a on a.id=f.achievement_id where f.user_id=p.id and a.active),'[]'::jsonb))
 from public.profiles p where p.id=target_id and (p.is_public or p.id=auth.uid());
$$;
revoke execute on function public.public_profile(uuid) from public;
grant execute on function public.public_profile(uuid) to anon,authenticated;
