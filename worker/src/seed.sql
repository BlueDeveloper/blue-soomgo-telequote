INSERT OR IGNORE INTO carriers (id, icon, icon_style, title, description, forms, sort_order) VALUES
('uplus-umobile', '📱', 'serviceIconPurple', 'U+ U모바일', 'LGU+ 알뜰폰', '가입신청서', 1),
('kt-mmobile', '📱', 'serviceIconBlue', 'KT M모바일', 'KT 알뜰폰', '가입신청서', 2),
('kt-skylife', '📱', 'serviceIconBlue', 'KT 스카이라이프', 'KT 알뜰폰', '가입신청서', 3),
('hello', '📱', 'serviceIconOrange', '헬로모바일', 'LGU+ 알뜰폰', '가입신청서', 4),
('freeti', '📱', 'serviceIconPurple', '프리티', '알뜰폰', '가입신청서', 5),
('mobing', '📱', 'serviceIconOrange', '모빙', '알뜰폰', '가입신청서', 6),
('sugar', '📱', 'serviceIconGreen', '슈가모바일', '알뜰폰', '가입신청서', 7),
('smartel', '📱', 'serviceIconOrange', 'SMT(스마텔)', 'SKT 알뜰폰', '가입신청서', 8),
('toss', '📱', 'serviceIconBlue', '토스모바일', '알뜰폰', '가입신청서', 9),
('iyagi', '📱', 'serviceIconGreen', '이야기모바일', '알뜰폰', '가입신청서', 10),
('code', '📱', 'serviceIconBlue', '코드모바일', '알뜰폰', '가입신청서', 11),
('ins', '📱', 'serviceIconBlue', 'INS모바일', '알뜰폰', '가입신청서', 12),
('hanpass', '📱', 'serviceIconGreen', '한패스모바일', '알뜰폰', '가입신청서', 13),
('sk7', '📱', 'serviceIconBlue', 'SK 7mobile', 'SKT 알뜰폰', '가입신청서', 14);

INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, sort_order) VALUES
('smartel', 'BAND 데이터 안심 300', 36000, 36000, 0, '기본제공 + (부가통화 50분)', '기본제공', '300MB', '최대 3Mbps 무제한', 'prepaid', 1),
('smartel', 'BAND 데이터 15GB+', 39000, 39000, 0, '100분 (부가통화 없음)', '100건', '15GB', '최대 3Mbps 무제한', 'prepaid', 2),
('smartel', 'BAND 데이터 퍼펙트', 59900, 59900, 0, '기본제공 + (부가통화 300분)', '기본제공', '11GB 소진 후 매일 2GB', '최대 3Mbps 무제한', 'prepaid', 3),
('smartel', 'BAND 데이터 에센스', 66000, 66000, 0, '기본제공 + (부가통화 300분)', '기본제공', '100GB', '최대 5Mbps 무제한', 'prepaid', 4),
('smartel', 'PPS Lite', 3300, 3300, 0, '2.64원/초', '22원/건', '22.53원/MB', '-', 'prepaid', 5),
('smartel', 'PPS BASIC', 4950, 4950, 0, '2.2원/초', '22원/건', '22.53원/MB', '-', 'prepaid', 6);
