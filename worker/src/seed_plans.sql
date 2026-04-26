-- SK 7mobile 요금제 (SKT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('sk7', '다이렉트 33', 33000, 33000, 0, '무제한', '무제한', '6GB', 'LTE', 'postpaid', 1, 1),
('sk7', '다이렉트 39', 39000, 39000, 0, '무제한', '무제한', '11GB', 'LTE', 'postpaid', 1, 2),
('sk7', '다이렉트 44', 44000, 44000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3),
('sk7', '다이렉트 49', 49000, 49000, 0, '무제한', '무제한', '100GB', 'LTE', 'postpaid', 1, 4),
('sk7', '선불 1.1', 11000, 11000, 0, '60분', '30건', '1GB', 'LTE', 'prepaid', 1, 5),
('sk7', '선불 2.2', 22000, 22000, 0, '120분', '60건', '5GB', 'LTE', 'prepaid', 1, 6);

-- KT M모바일 요금제 (KT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('kt-mmobile', '데이터 33', 33000, 33000, 0, '무제한', '무제한', '6GB', 'LTE', 'postpaid', 1, 1),
('kt-mmobile', '데이터 39', 39000, 39000, 0, '무제한', '무제한', '11GB', 'LTE', 'postpaid', 1, 2),
('kt-mmobile', '데이터 44', 44000, 44000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3),
('kt-mmobile', '5G 스탠다드 55', 55000, 55000, 0, '무제한', '무제한', '110GB', '5G', 'postpaid', 1, 4),
('kt-mmobile', '선불 11', 11000, 11000, 0, '60분', '30건', '1GB', 'LTE', 'prepaid', 1, 5);

-- KT 스카이라이프 요금제 (KT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('kt-skylife', '알뜰 29', 29000, 29000, 0, '무제한', '무제한', '4GB', 'LTE', 'postpaid', 1, 1),
('kt-skylife', '알뜰 35', 35000, 35000, 0, '무제한', '무제한', '8GB', 'LTE', 'postpaid', 1, 2),
('kt-skylife', '알뜰 42', 42000, 42000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- 프리티 요금제 (LGU+망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('freeti', '알뜰 29', 29000, 29000, 0, '무제한', '무제한', '3GB', 'LTE', 'postpaid', 1, 1),
('freeti', '알뜰 35', 35000, 35000, 0, '무제한', '무제한', '7GB', 'LTE', 'postpaid', 1, 2),
('freeti', '알뜰 42', 42000, 42000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3),
('freeti', '선불 9.9', 9900, 9900, 0, '40분', '20건', '500MB', 'LTE', 'prepaid', 1, 4);

-- 모빙 요금제 (SKT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('mobing', '심플 30', 30000, 30000, 0, '무제한', '무제한', '5GB', 'LTE', 'postpaid', 1, 1),
('mobing', '심플 38', 38000, 38000, 0, '무제한', '무제한', '10GB', 'LTE', 'postpaid', 1, 2),
('mobing', '심플 45', 45000, 45000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- 슈가모바일 요금제 (SKT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('sugar', '베이직 25', 25000, 25000, 0, '무제한', '무제한', '3GB', 'LTE', 'postpaid', 1, 1),
('sugar', '스탠다드 35', 35000, 35000, 0, '무제한', '무제한', '8GB', 'LTE', 'postpaid', 1, 2),
('sugar', '프리미엄 45', 45000, 45000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- 토스모바일 요금제 (SKT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('toss', '토스 2.2', 22000, 22000, 0, '무제한', '무제한', '2GB', 'LTE', 'postpaid', 1, 1),
('toss', '토스 3.3', 33000, 33000, 0, '무제한', '무제한', '6GB', 'LTE', 'postpaid', 1, 2),
('toss', '토스 4.4', 44000, 44000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3),
('toss', '토스 5.5', 55000, 55000, 0, '무제한', '무제한', '무제한', '5G', 'postpaid', 1, 4);

-- 이야기모바일 요금제 (KT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('iyagi', '라이트 25', 25000, 25000, 0, '무제한', '무제한', '3GB', 'LTE', 'postpaid', 1, 1),
('iyagi', '스탠다드 33', 33000, 33000, 0, '무제한', '무제한', '6GB', 'LTE', 'postpaid', 1, 2),
('iyagi', '프리미엄 42', 42000, 42000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- 코드모바일 요금제 (KT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('code', '코드 29', 29000, 29000, 0, '무제한', '무제한', '4GB', 'LTE', 'postpaid', 1, 1),
('code', '코드 36', 36000, 36000, 0, '무제한', '무제한', '8GB', 'LTE', 'postpaid', 1, 2),
('code', '코드 44', 44000, 44000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- INS모바일 요금제 (KT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('ins', 'INS 라이트 27', 27000, 27000, 0, '무제한', '무제한', '3GB', 'LTE', 'postpaid', 1, 1),
('ins', 'INS 베이직 35', 35000, 35000, 0, '무제한', '무제한', '7GB', 'LTE', 'postpaid', 1, 2),
('ins', 'INS 프리미엄 43', 43000, 43000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);

-- 한패스모바일 요금제 (SKT망)
INSERT OR IGNORE INTO plans (carrier_id, name, monthly, base_fee, discount, voice, sms, data, qos, type, is_active, sort_order) VALUES
('hanpass', '한패스 28', 28000, 28000, 0, '무제한', '무제한', '4GB', 'LTE', 'postpaid', 1, 1),
('hanpass', '한패스 36', 36000, 36000, 0, '무제한', '무제한', '8GB', 'LTE', 'postpaid', 1, 2),
('hanpass', '한패스 44', 44000, 44000, 0, '무제한', '무제한', '일 2GB', 'LTE', 'postpaid', 1, 3);
