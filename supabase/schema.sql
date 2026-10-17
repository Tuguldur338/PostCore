create table if not exists public.marketplace_role_bootstrap (
  email text primary key
    check (email = lower(email)),
  role text not null
    check (role in ('admin', 'marketplace_admin'))
);

insert into public.marketplace_role_bootstrap (email, role)
values
  ('tuguldur09252@gmail.com', 'admin'),
  ('tuguldur.b2016@orkhonschool.edu.mn', 'marketplace_admin'),
  ('irmuun.s2016@orkhonschool.edu.mn', 'marketplace_admin')
on conflict (email) do nothing;

revoke all on public.marketplace_role_bootstrap from public, anon, authenticated;

create table if not exists public.marketplace_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique
    check (email = lower(email)),
  display_name text not null default '',
  role text not null default 'student'
    check (role in ('student', 'marketplace_admin', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_marketplace_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.marketplace_profiles
    where user_id = (select auth.uid())
      and role in ('marketplace_admin', 'admin')
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.marketplace_profiles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.sync_marketplace_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bootstrap_role text;
begin
  if new.email_confirmed_at is not null then
    select role
    into bootstrap_role
    from public.marketplace_role_bootstrap
    where email = lower(new.email);
  end if;

  if tg_op = 'INSERT' then
    insert into public.marketplace_profiles (
      user_id, email, display_name, role
    )
    values (
      new.id,
      lower(new.email),
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(bootstrap_role, 'student')
    )
    on conflict (user_id) do nothing;
  elsif new.email is distinct from old.email
    or (old.email_confirmed_at is null and new.email_confirmed_at is not null) then
    update public.marketplace_profiles
    set email = lower(new.email),
        role = coalesce(bootstrap_role, 'student')
    where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_marketplace_profile on auth.users;
create trigger sync_marketplace_profile
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_marketplace_profile();

insert into public.marketplace_profiles (user_id, email, display_name, role)
select
  users.id,
  lower(users.email),
  coalesce(users.raw_user_meta_data ->> 'full_name', ''),
  coalesce(
    case
      when users.email_confirmed_at is not null then bootstrap.role
    end,
    'student'
  )
from auth.users as users
left join public.marketplace_role_bootstrap as bootstrap
  on bootstrap.email = lower(users.email)
on conflict (user_id) do nothing;

alter table public.marketplace_profiles enable row level security;
revoke all on public.marketplace_profiles from public, anon, authenticated;
grant select on public.marketplace_profiles to authenticated;
grant update (role) on public.marketplace_profiles to authenticated;

drop policy if exists "Users can view their own marketplace profile" on public.marketplace_profiles;
create policy "Users can view their own marketplace profile"
  on public.marketplace_profiles for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_platform_admin())
  );

drop policy if exists "Platform admins can assign marketplace roles" on public.marketplace_profiles;
create policy "Platform admins can assign marketplace roles"
  on public.marketplace_profiles for update
  to authenticated
  using (
    (select public.is_platform_admin())
    and user_id <> (select auth.uid())
  )
  with check (
    (select public.is_platform_admin())
    and user_id <> (select auth.uid())
  );

create or replace function public.protect_primary_marketplace_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.email = 'tuguldur09252@gmail.com' and new.role <> 'admin' then
    raise exception 'The primary platform admin role cannot be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_primary_marketplace_admin on public.marketplace_profiles;
create trigger protect_primary_marketplace_admin
  before update of role on public.marketplace_profiles
  for each row execute function public.protect_primary_marketplace_admin();

create table if not exists public.products (
  id text primary key
    check (char_length(id) between 1 and 36),
  name text not null
    check (char_length(btrim(name)) between 1 and 200),
  price text not null
    check (price ~ '^[1-9][0-9]{0,11}$'),
  badge text not null
    check (char_length(btrim(badge)) between 1 and 80),
  description text not null
    check (char_length(btrim(description)) between 1 and 2000),
  image text not null
    check (char_length(btrim(image)) between 1 and 220000),
  category text not null
    check (char_length(btrim(category)) between 1 and 80),
  fits_for text not null
    check (char_length(btrim(fits_for)) between 1 and 200),
  seller_email text
    check (seller_email is null or char_length(seller_email) <= 320),
  quantity integer
    check (quantity is null or quantity >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.products (
  id, name, price, badge, description, image, category, fits_for, quantity
)
values
  (
    'seed-1',
    'Campus Notes Pack',
    '12990',
    'New',
    'A ready-to-go study set with notebook pages, tabs, and extras.',
    '/images/student/campus-notes.svg',
    'School Supplies',
    'Class notes / study sessions',
    null
  ),
  (
    'seed-2',
    'Snack Box Bundle',
    '18500',
    'Best seller',
    'A mix of student-friendly snacks for late nights and long study days.',
    '/images/student/snack-box.svg',
    'Snacks',
    'Dorms / study breaks / campus life',
    null
  )
on conflict (id) do nothing;

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select (
  id, name, price, badge, description, image, category, fits_for, quantity,
  is_available, created_at
) on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view available products" on public.products;
create policy "Anyone can view available products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Marketing admin can create products" on public.products;
create policy "Marketing admin can create products"
  on public.products for insert
  to authenticated
  with check (
    (select public.is_marketplace_admin())
  );

drop policy if exists "Marketing admin can update products" on public.products;
create policy "Marketing admin can update products"
  on public.products for update
  to authenticated
  using (
    (select public.is_marketplace_admin())
  )
  with check (
    (select public.is_marketplace_admin())
  );

drop policy if exists "Marketing admin can delete products" on public.products;
create policy "Marketing admin can delete products"
  on public.products for delete
  to authenticated
  using (
    (select public.is_marketplace_admin())
  );

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique
    check (char_length(order_reference) between 1 and 36),
  product_id text references public.products(id) on delete set null,
  product_name text not null
    check (char_length(btrim(product_name)) between 1 and 200),
  price text not null
    check (char_length(btrim(price)) between 1 and 100),
  quantity integer not null default 1
    check (quantity > 0),
  seller_email text
    check (seller_email is null or char_length(seller_email) <= 320),
  delivery_address jsonb not null
    check (
      delivery_address ?& array[
        'recipient',
        'classNumber',
        'roomNumber',
        'building',
        'instructions'
      ]
      and jsonb_typeof(delivery_address) = 'object'
      and jsonb_typeof(delivery_address -> 'recipient') = 'string'
      and char_length(btrim(delivery_address ->> 'recipient')) between 1 and 200
      and jsonb_typeof(delivery_address -> 'classNumber') = 'string'
      and (delivery_address ->> 'classNumber') ~* '^(?:[1-9]|1[0-2])[A-D]$'
      and jsonb_typeof(delivery_address -> 'roomNumber') = 'string'
      and char_length(delivery_address ->> 'roomNumber') <= 100
      and jsonb_typeof(delivery_address -> 'building') = 'string'
      and (delivery_address ->> 'building') in ('', '1', '2', '3', '4')
      and jsonb_typeof(delivery_address -> 'instructions') = 'string'
      and char_length(delivery_address ->> 'instructions') <= 1000
      and (
        char_length(btrim(delivery_address ->> 'roomNumber')) > 0
        or char_length(btrim(delivery_address ->> 'building')) > 0
      )
    ),
  status text not null default 'new'
    check (status in ('new', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists product_id text
    references public.products(id) on delete set null;
alter table public.orders
  add column if not exists quantity integer not null default 1
    check (quantity > 0);

alter table public.orders enable row level security;
revoke all on public.orders from public, anon, authenticated;
grant select, delete on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "Anyone can submit an order" on public.orders;
drop policy if exists "Marketing admin can view orders" on public.orders;
create policy "Marketing admin can view orders"
  on public.orders for select
  to authenticated
  using (
    (select public.is_marketplace_admin())
  );

drop policy if exists "Marketing admin can update orders" on public.orders;
create policy "Marketing admin can update orders"
  on public.orders for update
  to authenticated
  using (
    (select public.is_marketplace_admin())
  )
  with check (
    (select public.is_marketplace_admin())
  );

drop policy if exists "Marketing admin can delete orders" on public.orders;
create policy "Marketing admin can delete orders"
  on public.orders for delete
  to authenticated
  using (
    (select public.is_marketplace_admin())
  );

create or replace function public.place_order(
  p_product_id text,
  p_quantity integer,
  p_delivery_address jsonb,
  p_order_reference text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_product public.products%rowtype;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception using message = 'INVALID_QUANTITY', errcode = 'P0001';
  end if;

  select *
  into selected_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception using message = 'PRODUCT_NOT_FOUND', errcode = 'P0001';
  end if;
  if not selected_product.is_available then
    raise exception using message = 'PRODUCT_UNAVAILABLE', errcode = 'P0001';
  end if;
  if selected_product.quantity is not null
    and selected_product.quantity < p_quantity then
    raise exception using message = 'INSUFFICIENT_STOCK', errcode = 'P0001';
  end if;

  if selected_product.quantity is not null then
    update public.products
    set quantity = quantity - p_quantity,
        is_available = quantity - p_quantity > 0
    where id = p_product_id;
  end if;

  insert into public.orders (
    order_reference,
    product_id,
    product_name,
    price,
    quantity,
    seller_email,
    delivery_address
  )
  values (
    p_order_reference,
    selected_product.id,
    selected_product.name,
    selected_product.price,
    p_quantity,
    selected_product.seller_email,
    p_delivery_address
  );

  return p_order_reference;
end;
$$;

revoke all on function public.place_order(text, integer, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.place_order(text, integer, jsonb, text)
  to anon, authenticated;
