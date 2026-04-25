-- 1. parent_id 컬럼 추가
ALTER TABLE carriers ADD COLUMN parent_id TEXT DEFAULT NULL;

-- 2. 대분류(MNO) 삽입
INSERT OR IGNORE INTO carriers (id, icon, icon_style, title, description, forms, sort_order, parent_id) VALUES
('skt', '🔴', 'serviceIconOrange', 'SK텔레콤', 'SKT 망', '', 1, NULL),
('kt', '🔵', 'serviceIconBlue', 'KT', 'KT 망', '', 2, NULL),
('lgu', '🟣', 'serviceIconPurple', 'LG U+', 'LGU+ 망', '', 3, NULL);

-- 3. 기존 알뜰폰에 parent_id 설정
UPDATE carriers SET parent_id = 'lgu' WHERE id = 'uplus-umobile';
UPDATE carriers SET parent_id = 'kt' WHERE id = 'kt-mmobile';
UPDATE carriers SET parent_id = 'kt' WHERE id = 'kt-skylife';
UPDATE carriers SET parent_id = 'lgu' WHERE id = 'hello';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'smartel';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'sk7';
UPDATE carriers SET parent_id = 'lgu' WHERE id = 'freeti';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'mobing';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'sugar';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'toss';
UPDATE carriers SET parent_id = 'kt' WHERE id = 'iyagi';
UPDATE carriers SET parent_id = 'kt' WHERE id = 'code';
UPDATE carriers SET parent_id = 'kt' WHERE id = 'ins';
UPDATE carriers SET parent_id = 'skt' WHERE id = 'hanpass';
