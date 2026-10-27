-- хэрэглэл SOS: байршлыг охин өөрөө бичдэг болгоно (хамгийн ихдээ 40 тэмдэгт).
-- friends.sql-ийн дараа нэг удаа ажиллуулна. Дахин ажиллуулсан ч асуудалгүй.
alter table public.pad_requests drop constraint if exists pad_requests_place_check;
alter table public.pad_requests
  add constraint pad_requests_place_check check (char_length(place) <= 40);
