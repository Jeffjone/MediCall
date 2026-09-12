-- Roles enum
create type public.app_role as enum ('admin', 'staff');

-- Profiles table (one row per auth user)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pharmacy_name text not null,
  pharmacy_location text,
  license_number text,
  full_name text,
  email text,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- User roles table (separate from profiles per security rules)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

-- Grants
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- has_role security definer function (must exist before policies)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Profiles policies: a user reads/updates their own row; admins read all
create policy "profiles_self_select"
  on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles_self_update"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
create policy "profiles_admin_select"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "profiles_admin_update"
  on public.profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- User roles policies: a user reads their own roles; admins read/update all
create policy "roles_self_select"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());
create policy "roles_admin_all"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup. Profile fields come from signUp options.data.
-- Bootstrap: the very first user becomes an approved admin; later users are pending staff.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.user_roles) into is_first;

  insert into public.profiles (id, pharmacy_name, pharmacy_location, license_number, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'pharmacy_name', 'Unregistered Pharmacy'),
    new.raw_user_meta_data->>'pharmacy_location',
    new.raw_user_meta_data->>'license_number',
    new.raw_user_meta_data->>'full_name',
    new.email
  );

  if is_first then
    update public.profiles set approval_status = 'approved' where id = new.id;
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'staff') on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
