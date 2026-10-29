create table if not exists public.store_product_categories (
  id text primary key,
  label text not null,
  enabled_by_default boolean not null default false,
  parent_approval boolean not null default false,
  minimum_age integer,
  maximum_age integer,
  always_blocked boolean not null default false,
  default_weekly_limit integer,
  check (default_weekly_limit is null or default_weekly_limit >= 0),
  check (minimum_age is null or minimum_age between 8 and 12),
  check (maximum_age is null or maximum_age between 8 and 12),
  check (not (always_blocked and enabled_by_default)),
  check (not (always_blocked and parent_approval))
);

alter table public.store_product_categories
  add column if not exists maximum_age integer;

insert into public.store_product_categories
  (id, label, enabled_by_default, parent_approval, minimum_age, maximum_age, always_blocked, default_weekly_limit)
values
  ('personal_hygiene', 'Хувийн ариун цэвэр', true, false, null, null, false, null),
  ('hair_accessories', 'Үсний хэрэглэл', true, false, null, null, false, null),
  ('school_supplies', 'Хичээлийн хэрэглэл', true, false, null, null, false, null),
  ('books_and_puzzles', 'Ном, эвлүүлдэг тоглоом', true, false, null, null, false, null),
  ('arts_and_crafts', 'Зураг, урлал', true, false, null, null, false, null),
  ('healthy_food_drinks', 'Эрүүл хүнс, ундаа', true, false, null, null, false, null),
  ('sports_and_activities', 'Спорт, идэвхтэй үйл ажиллагаа', true, false, null, null, false, null),
  ('experiences', 'Тасалбар, сургалт', true, false, null, null, false, null),
  ('sweets', 'Чихэрлэг зүйл', true, false, null, null, false, 10000),
  ('feminine_hygiene', 'Эмэгтэйчүүдийн ариун цэвэр', false, true, 11, 12, false, null),
  ('medicine', 'Эм, витамин, нэмэлт бүтээгдэхүүн', false, false, null, null, true, null),
  ('health_products', 'Жин, эрүүл мэндийн бүтээгдэхүүн', false, false, null, null, true, null),
  ('adult_cosmetics', 'Насанд хүрэгчдийн гоо сайхан', false, false, null, null, true, null),
  ('chemicals', 'Хүчтэй химийн бүтээгдэхүүн', false, false, null, null, true, null),
  ('sharp_objects', 'Иртэй зүйл', false, false, null, null, true, null),
  ('age_restricted', 'Насны хязгаартай бүтээгдэхүүн', false, false, null, null, true, null),
  ('financial', 'Санхүүгийн бүтээгдэхүүн', false, false, null, null, true, null),
  ('digital_unrestricted', 'Хязгааргүй дижитал худалдан авалт', false, false, null, null, true, null)
on conflict (id) do update set
  label = excluded.label,
  enabled_by_default = excluded.enabled_by_default,
  parent_approval = excluded.parent_approval,
  minimum_age = excluded.minimum_age,
  maximum_age = excluded.maximum_age,
  always_blocked = excluded.always_blocked,
  default_weekly_limit = excluded.default_weekly_limit;

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  merchant text not null,
  name text not null,
  price_mnt integer not null check (price_mnt >= 0),
  category_id text references public.store_product_categories (id) on delete restrict,
  image_url text,
  emoji text not null default '🛍️',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists store_products_active_category_idx
  on public.store_products (category_id, merchant, name) where active;

insert into public.store_products (sku, merchant, name, price_mnt, category_id, emoji)
values
  ('DEMO-MONOS-TOOTHPASTE-001', 'eMonos · жишээ каталог', 'Хүүхдийн зөөлөн оо', 8900, 'personal_hygiene', '🪥'),
  ('DEMO-MONOS-BRUSH-001', 'eMonos · жишээ каталог', 'Зөөлөн үстэй сойз', 6500, 'personal_hygiene', '🪥'),
  ('DEMO-MONOS-WIPES-001', 'eMonos · жишээ каталог', 'Нойтон салфетка', 5900, 'personal_hygiene', '🧻'),
  ('DEMO-MONOS-PADS-001', 'eMonos · жишээ каталог', 'Ариун цэврийн хэрэглэл', 12900, 'feminine_hygiene', '🌸'),
  ('DEMO-MONOS-MEDICINE-001', 'eMonos · жишээ каталог', 'Эмийн бүтээгдэхүүн (хориглосон)', 15900, 'medicine', '⛔'),
  ('DEMO-SWEETS-CHOCOLATE-001', 'Bloomy · жишээ каталог', 'Шоколад · жишээ', 3500, 'sweets', '🍫'),
  ('DEMO-SCHOOL-NOTEBOOK-001', 'Bloomy · жишээ каталог', 'Тэмдэглэлийн дэвтэр', 4500, 'school_supplies', '📓'),
  ('DEMO-BOOK-PUZZLE-001', 'Bloomy · жишээ каталог', 'Эвлүүлдэг зураг', 9900, 'books_and_puzzles', '🧩')
on conflict (sku) do update set
  merchant = excluded.merchant,
  name = excluded.name,
  price_mnt = excluded.price_mnt,
  category_id = excluded.category_id,
  emoji = excluded.emoji,
  active = true,
  updated_at = now();

create table if not exists public.child_purchase_settings (
  child_id uuid primary key references public.profiles (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  daily_limit_mnt integer not null default 20000 check (daily_limit_mnt >= 0),
  weekly_limit_mnt integer not null default 80000 check (weekly_limit_mnt >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_purchase_category_rules (
  child_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.store_product_categories (id) on delete restrict,
  enabled boolean,
  daily_limit_mnt integer check (daily_limit_mnt is null or daily_limit_mnt >= 0),
  weekly_limit_mnt integer check (weekly_limit_mnt is null or weekly_limit_mnt >= 0),
  updated_at timestamptz not null default now(),
  primary key (child_id, category_id)
);

create table if not exists public.child_purchase_attempts (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.store_products (id) on delete set null,
  sku text,
  product_name text not null,
  category_id text,
  quantity integer not null default 1,
  total_mnt integer not null default 0,
  allowed boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists child_purchase_attempts_history_idx
  on public.child_purchase_attempts (child_id, created_at desc);
create index if not exists child_purchase_attempts_spend_idx
  on public.child_purchase_attempts (child_id, created_at desc) where allowed;

alter table public.store_product_categories enable row level security;
alter table public.store_products enable row level security;
alter table public.child_purchase_settings enable row level security;
alter table public.child_purchase_category_rules enable row level security;
alter table public.child_purchase_attempts enable row level security;

create or replace function public.record_child_store_purchase(p_child_id uuid, p_product_id uuid, p_quantity integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_child public.profiles%rowtype;
  v_product public.store_products%rowtype;
  v_category public.store_product_categories%rowtype;
  v_rule public.child_purchase_category_rules%rowtype;
  v_settings public.child_purchase_settings%rowtype;
  v_age integer;
  v_total integer;
  v_category_daily_spend integer := 0;
  v_category_weekly_spend integer := 0;
  v_total_daily_spend integer := 0;
  v_total_weekly_spend integer := 0;
  v_daily_limit integer := 20000;
  v_weekly_limit integer := 80000;
  v_category_daily_limit integer;
  v_category_weekly_limit integer;
  v_category_enabled boolean := false;
  v_reason text;
  v_attempt_id bigint;
  v_parent_id uuid;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    insert into public.child_purchase_attempts
      (child_id, product_name, quantity, allowed, reason)
    values (p_child_id, 'Тодорхойгүй бараа', coalesce(p_quantity, 0), false, 'invalid_quantity')
    returning id into v_attempt_id;
    return jsonb_build_object('allowed', false, 'reason', 'invalid_quantity', 'attempt_id', v_attempt_id);
  end if;

  select * into v_child from public.profiles where id = p_child_id and role = 'daughter';
  if not found then
    insert into public.child_purchase_attempts
      (child_id, product_id, sku, product_name, quantity, allowed, reason)
    values (p_child_id, p_product_id, null, 'Тодорхойгүй бараа', p_quantity, false, 'child_profile_not_found')
    returning id into v_attempt_id;
    return jsonb_build_object('allowed', false, 'reason', 'child_profile_not_found', 'attempt_id', v_attempt_id);
  end if;

  select * into v_product from public.store_products where id = p_product_id and active;
  if not found then
    insert into public.child_purchase_attempts
      (child_id, product_id, sku, product_name, quantity, allowed, reason)
    values (p_child_id, null, null, 'Тодорхойгүй бараа', p_quantity, false, 'product_not_found')
    returning id into v_attempt_id;
    return jsonb_build_object('allowed', false, 'reason', 'product_not_found', 'attempt_id', v_attempt_id);
  end if;

  v_total := v_product.price_mnt * p_quantity;
  if v_product.category_id is not null then
    select * into v_category from public.store_product_categories where id = v_product.category_id;
  end if;

  if v_child.birth_date is null then
    v_reason := 'birthdate_missing';
  else
    v_age := extract(year from age((now() at time zone 'Asia/Ulaanbaatar')::date, v_child.birth_date))::integer;
  end if;

  if v_reason is null and v_age < 8 then
    v_reason := 'age_restricted';
  end if;

  if v_reason is null then
    perform pg_advisory_xact_lock(hashtextextended(p_child_id::text, 0));

    if v_product.category_id is null or v_category.id is null then
      v_reason := 'category_unknown';
    elsif v_category.always_blocked then
      v_reason := 'category_restricted';
    else
      select * into v_rule
      from public.child_purchase_category_rules
      where child_id = p_child_id and category_id = v_category.id;

      if v_category.parent_approval then
        if v_age < coalesce(v_category.minimum_age, 13)
            or v_age > coalesce(v_category.maximum_age, 12) then
          v_reason := 'age_restricted';
        elsif not coalesce(v_rule.enabled, false) then
          v_reason := 'parent_approval_required';
        end if;
      elsif not coalesce(v_rule.enabled, v_category.enabled_by_default) then
        v_reason := 'category_not_enabled';
      end if;

      v_category_daily_limit := v_rule.daily_limit_mnt;
      v_category_weekly_limit := coalesce(v_rule.weekly_limit_mnt, v_category.default_weekly_limit);
      select * into v_settings from public.child_purchase_settings where child_id = p_child_id;
      if found then
        v_daily_limit := v_settings.daily_limit_mnt;
        v_weekly_limit := v_settings.weekly_limit_mnt;
      end if;

      if v_reason is null then
        select
          coalesce(sum(total_mnt) filter (where created_at >= now() - interval '7 days'), 0)::integer,
          coalesce(sum(total_mnt) filter (
            where created_at >= (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') at time zone 'Asia/Ulaanbaatar')
          ), 0)::integer,
          coalesce(sum(total_mnt) filter (
            where created_at >= now() - interval '7 days' and category_id = v_category.id
          ), 0)::integer,
          coalesce(sum(total_mnt) filter (
            where created_at >= (date_trunc('day', now() at time zone 'Asia/Ulaanbaatar') at time zone 'Asia/Ulaanbaatar')
              and category_id = v_category.id
          ), 0)::integer
        into v_total_weekly_spend, v_total_daily_spend, v_category_weekly_spend, v_category_daily_spend
        from public.child_purchase_attempts
        where child_id = p_child_id and allowed;

        if v_category_weekly_limit is not null and v_category_weekly_spend + v_total > v_category_weekly_limit then
          v_reason := 'category_weekly_limit';
        elsif v_category_daily_limit is not null and v_category_daily_spend + v_total > v_category_daily_limit then
          v_reason := 'category_daily_limit';
        elsif v_total_daily_spend + v_total > v_daily_limit then
          v_reason := 'daily_limit';
        elsif v_total_weekly_spend + v_total > v_weekly_limit then
          v_reason := 'weekly_limit';
        end if;
      end if;
    end if;
  end if;

  insert into public.child_purchase_attempts
    (child_id, product_id, sku, product_name, category_id, quantity, total_mnt, allowed, reason)
  values
    (p_child_id, v_product.id, v_product.sku, v_product.name, v_product.category_id, p_quantity, v_total, v_reason is null, v_reason)
  returning id into v_attempt_id;

  if v_reason is null and v_child.family_id is not null then
    select id into v_parent_id
    from public.profiles
    where family_id = v_child.family_id and role = 'mother'
    order by created_at
    limit 1;

    if v_parent_id is not null then
      insert into public.notifications (family_id, sender_id, recipient_id, recipient_role, kind, text)
      values (
        v_child.family_id,
        p_child_id,
        v_parent_id,
        'mother',
        'info',
        format('%s бараа худалдан авах хүсэлтээ амжилттай бүртгэлээ (%s₮).', v_product.name, v_total)
      );
    end if;
  end if;

  return jsonb_build_object(
    'allowed', v_reason is null,
    'reason', v_reason,
    'attempt_id', v_attempt_id,
    'product_name', v_product.name,
    'total_mnt', v_total,
    'category_id', v_product.category_id,
    'category_weekly_limit_mnt', v_category_weekly_limit,
    'category_weekly_spent_mnt', v_category_weekly_spend + case when v_reason is null then v_total else 0 end,
    'daily_remaining_mnt', greatest(v_daily_limit - v_total_daily_spend - case when v_reason is null then v_total else 0 end, 0),
    'weekly_remaining_mnt', greatest(v_weekly_limit - v_total_weekly_spend - case when v_reason is null then v_total else 0 end, 0)
  );
end;
$$;

revoke all on function public.record_child_store_purchase(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.record_child_store_purchase(uuid, uuid, integer) to service_role;
