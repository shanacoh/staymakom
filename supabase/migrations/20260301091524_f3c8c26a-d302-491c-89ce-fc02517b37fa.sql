
ALTER TABLE public.categories ADD COLUMN show_on_home boolean NOT NULL DEFAULT true;
ALTER TABLE public.categories ADD COLUMN show_on_launch boolean NOT NULL DEFAULT true;
