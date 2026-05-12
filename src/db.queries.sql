create table user_details (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  agent_api_key text,
  agent_api_url text,
  created_at timestamp default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_details (id, email)
  values (new.id, new.email);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table user_details enable row level security;

create policy "Users can view own profile"
on user_details
for select
using (auth.uid() = id);

create policy "Users can update own profile"
on user_details
for update
using (auth.uid() = id);