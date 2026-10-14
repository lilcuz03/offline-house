-- OPTIONAL. Twelve SAMPLE products so the pages have something to show.
-- Delete them (delete from public.products;) before you add real stock.

insert into public.products
  (slug, name, description, category, collections, price_cents, compare_at_cents, badge, stock, sales_count, details)
values
  ('gan-charger-65w','65W GaN Charger','Sample product. Replace with your real description.','Tech','{tech,top-sellers}',44900,59900,'Best seller',50,212,'{"Sample detail one","Sample detail two"}'),
  ('braided-usb-c-cable','Braided USB-C Cable, 2 m','Sample product. Replace with your real description.','Tech','{tech,top-sellers}',18900,null,null,50,148,'{}'),
  ('magnetic-phone-case','Magnetic Phone Case','Sample product. Replace with your real description.','Tech','{tech}',32900,null,'New',50,96,'{}'),
  ('wireless-earbuds','Wireless Earbuds','Sample product. Replace with your real description.','Tech','{tech,top-sellers}',79900,99900,null,50,304,'{}'),
  ('ceramic-diffuser','Ceramic Aroma Diffuser','Sample product. Replace with your real description.','Home','{home,top-sellers}',35900,null,null,50,61,'{}'),
  ('silk-sleep-mask','Silk Sleep Mask','Sample product. Replace with your real description.','Beauty','{beauty,top-sellers}',21900,null,null,50,87,'{}'),
  ('desk-organiser','Oak Desk Organiser','Sample product. Replace with your real description.','Living','{living}',49900,null,null,50,42,'{}'),
  ('travel-organiser','Cable Travel Organiser','Sample product. Replace with your real description.','Essentials','{essentials,top-sellers}',15900,null,null,50,119,'{}'),
  ('wall-charger-duo','Dual-Port Wall Charger','Sample product. Replace with your real description.','Tech','{tech}',27900,34900,null,50,73,'{}'),
  ('linen-throw','Linen Throw Blanket','Sample product. Replace with your real description.','Living','{living,home}',64900,null,null,50,38,'{}'),
  ('face-roller','Rose Quartz Face Roller','Sample product. Replace with your real description.','Beauty','{beauty}',24900,29900,null,50,55,'{}'),
  ('metal-bottle','Insulated Steel Bottle','Sample product. Replace with your real description.','Essentials','{essentials,home}',29900,null,null,50,101,'{}')
on conflict (slug) do nothing;
