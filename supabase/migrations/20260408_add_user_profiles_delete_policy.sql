alter table public.user_profiles enable row level security;

drop policy if exists "Users can delete own profile" on public.user_profiles;
create policy "Users can delete own profile"
on public.user_profiles
for delete
using (auth.uid() = user_id);
