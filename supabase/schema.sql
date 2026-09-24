-- Kitchen Inventory App - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HOUSEHOLDS
-- ============================================================
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HOUSEHOLD MEMBERS
-- ============================================================
CREATE TYPE public.member_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'editor',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user ON public.household_members(user_id);
CREATE INDEX idx_household_members_household ON public.household_members(household_id);

-- ============================================================
-- HOUSEHOLD INVITES (share links)
-- ============================================================
CREATE TABLE public.household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role public.member_role NOT NULL DEFAULT 'editor',
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_household_invites_token ON public.household_invites(token) WHERE revoked_at IS NULL;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE, -- NULL = system default
  name TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, name)
);

CREATE INDEX idx_categories_household ON public.categories(household_id);

-- Seed system default categories
INSERT INTO public.categories (id, household_id, name, icon, sort_order) VALUES
  (uuid_generate_v4(), NULL, 'Dairy', '🥛', 10),
  (uuid_generate_v4(), NULL, 'Meat', '🥩', 20),
  (uuid_generate_v4(), NULL, 'Seafood', '🐟', 30),
  (uuid_generate_v4(), NULL, 'Produce', '🥬', 40),
  (uuid_generate_v4(), NULL, 'Fruit', '🍎', 50),
  (uuid_generate_v4(), NULL, 'Vegetables', '🥦', 60),
  (uuid_generate_v4(), NULL, 'Beverages', '🥤', 70),
  (uuid_generate_v4(), NULL, 'Canned Goods', '🥫', 80),
  (uuid_generate_v4(), NULL, 'Bakery', '🍞', 90),
  (uuid_generate_v4(), NULL, 'Pasta & Grains', '🍝', 100),
  (uuid_generate_v4(), NULL, 'Condiments & Sauces', '🧂', 110),
  (uuid_generate_v4(), NULL, 'Pantry', '📦', 120),
  (uuid_generate_v4(), NULL, 'Frozen', '❄️', 130),
  (uuid_generate_v4(), NULL, 'Snacks', '🍿', 140),
  (uuid_generate_v4(), NULL, 'Breakfast', '🥣', 150),
  (uuid_generate_v4(), NULL, 'Household', '🧴', 160),
  (uuid_generate_v4(), NULL, 'Kids', '🧒', 170),
  (uuid_generate_v4(), NULL, 'Pet', '🐕', 180),
  (uuid_generate_v4(), NULL, 'Other', '📦', 999);

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TYPE public.item_status AS ENUM ('out', 'low', 'available');
CREATE TYPE public.quantity_level AS ENUM ('full', 'three_quarter', 'half', 'quarter', 'almost_empty', 'empty');
CREATE TYPE public.item_location AS ENUM ('refrigerator', 'freezer', 'pantry', 'kitchen', 'other');

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  status public.item_status NOT NULL DEFAULT 'available',
  quantity_level public.quantity_level,
  quantity_value NUMERIC,
  quantity_unit TEXT,
  location public.item_location NOT NULL DEFAULT 'pantry',
  image_path TEXT, -- path in storage bucket
  expiration_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purchased_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_items_household ON public.items(household_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_items_status ON public.items(household_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_items_category ON public.items(household_id, category_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_items_location ON public.items(household_id, location) WHERE is_deleted = FALSE;
CREATE INDEX idx_items_updated ON public.items(household_id, updated_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_items_expiration ON public.items(household_id, expiration_date) WHERE is_deleted = FALSE AND expiration_date IS NOT NULL;

-- ============================================================
-- ITEM HISTORY (append-only status/quantity changes)
-- ============================================================
CREATE TABLE public.item_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  status public.item_status,
  quantity_level public.quantity_level,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX idx_item_history_item ON public.item_history(item_id, changed_at DESC);

-- ============================================================
-- SHOPPING LIST ITEMS
-- ============================================================
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL, -- linked inventory item (nullable for free-form)
  name TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  quantity_note TEXT, -- e.g. "2 gallons"
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_shopping_list_household ON public.shopping_list_items(household_id, checked, sort_order);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of household
CREATE OR REPLACE FUNCTION public.is_household_member(h_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check role
CREATE OR REPLACE FUNCTION public.household_role(h_id UUID)
RETURNS public.member_role AS $$
  SELECT role FROM public.household_members
  WHERE household_id = h_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HOUSEHOLDS policies
CREATE POLICY "Members can view their households"
  ON public.households FOR SELECT
  USING (public.is_household_member(id));

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update household"
  ON public.households FOR UPDATE
  USING (public.household_role(id) = 'owner');

CREATE POLICY "Owners can delete household"
  ON public.households FOR DELETE
  USING (public.household_role(id) = 'owner');

-- HOUSEHOLD_MEMBERS policies
CREATE POLICY "Members can view members of their households"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Owners can manage members"
  ON public.household_members FOR ALL
  USING (public.household_role(household_id) = 'owner');

-- Allow users to insert themselves when joining via invite (handled in function)
CREATE POLICY "Users can join via invite"
  ON public.household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- HOUSEHOLD_INVITES policies
CREATE POLICY "Members can view invites of their households"
  ON public.household_invites FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Owners and editors can create invites"
  ON public.household_invites FOR INSERT
  WITH CHECK (public.household_role(household_id) IN ('owner', 'editor'));

CREATE POLICY "Owners can update/revoke invites"
  ON public.household_invites FOR UPDATE
  USING (public.household_role(household_id) = 'owner');

-- CATEGORIES policies
CREATE POLICY "Anyone can view system categories"
  ON public.categories FOR SELECT
  USING (household_id IS NULL OR public.is_household_member(household_id));

CREATE POLICY "Editors can manage household categories"
  ON public.categories FOR ALL
  USING (
    household_id IS NOT NULL
    AND public.household_role(household_id) IN ('owner', 'editor')
  );

-- ITEMS policies
CREATE POLICY "Members can view items"
  ON public.items FOR SELECT
  USING (public.is_household_member(household_id) AND is_deleted = FALSE);

CREATE POLICY "Editors can insert items"
  ON public.items FOR INSERT
  WITH CHECK (public.household_role(household_id) IN ('owner', 'editor'));

CREATE POLICY "Editors can update items"
  ON public.items FOR UPDATE
  USING (public.household_role(household_id) IN ('owner', 'editor'));

CREATE POLICY "Editors can soft-delete items"
  ON public.items FOR DELETE
  USING (public.household_role(household_id) IN ('owner', 'editor'));

-- ITEM_HISTORY policies
CREATE POLICY "Members can view history"
  ON public.item_history FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Editors can insert history"
  ON public.item_history FOR INSERT
  WITH CHECK (public.household_role(household_id) IN ('owner', 'editor'));

-- SHOPPING_LIST_ITEMS policies
CREATE POLICY "Members can view shopping list"
  ON public.shopping_list_items FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Editors can manage shopping list"
  ON public.shopping_list_items FOR ALL
  USING (public.household_role(household_id) IN ('owner', 'editor'));

-- ============================================================
-- STORAGE BUCKET (run in Storage settings or via SQL if available)
-- ============================================================
-- Create bucket: item-images (private)
-- Policy: members of household can read/write objects under {household_id}/

-- Example storage policy (adjust as needed):
-- CREATE POLICY "Household members can upload images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'item-images'
--   AND public.is_household_member((storage.foldername(name))[1]::uuid)
-- );

-- ============================================================
-- REALTIME
-- ============================================================
-- In Supabase Dashboard → Database → Replication:
-- Enable realtime for: items, shopping_list_items, household_members
