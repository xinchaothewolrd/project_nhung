DROP DATABASE IF EXISTS health_monitor;
CREATE DATABASE health_monitor;
USE health_monitor;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('PATIENT','DOCTOR','ADMIN') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PATIENT',
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
INSERT INTO `Users` VALUES 
  (1,'ducsyba','$2b$10$kdzI13AVPimE/8Y0MX0E/uMEFSWIyx89iJwNGSsP7LBOVrZYSaXLi','PATIENT','nguyen van duc','2026-05-29 14:33:31','2026-06-06 14:53:53','0912000001'),
  (2,'nguyenvana','$2b$10$H9PVyeGROoaG3Cx2y9eUvOPIqIYWpwwQP5cWonUynYwYSLaH3rNF2','PATIENT','nguyen van a','2026-06-06 04:08:22','2026-06-06 04:08:22','0912000002'),
  (3,'test','$2b$10$y6XBtTM3C/t4RgWiEIse5.Odr325zYQvGd97GA3NTCfITID3AE45O','DOCTOR','test','2026-06-06 13:50:56','2026-06-06 13:50:56','0912000003'),
  (4,'patient1','$2b$10$DHVTcv.TzXXZrGiejYBmqO0W2wz4V.5yHcUeFPd1xD3zt.IZ1Juya','PATIENT','Patient One','2026-06-06 13:53:21','2026-06-06 13:53:21','0912000004'),
  (5,'bacsi_admin','$2b$10$MFhB4ZK39KLqaV788DJDmuWDLOyM8kQHrt.yMQ2CEyZohrELclpN.','DOCTOR','Bac Si Admin','2026-06-06 14:11:16','2026-06-06 14:11:16','0912000005'),
  (6,'user','$2b$10$zyH2gBqls7hnhMH7el0B7.Jbu/IDuL4T4IaR9cCNAlVIZNUzwbFhq','PATIENT','user','2026-06-06 14:18:19','2026-06-06 14:18:19','0912000006'),
  (7,'admin','$2b$10$cETrh6MieloMbyejW98/iOnXv4BnUf.Gwrfwlp08ihUgucTkMg5Se','ADMIN','Administrator','2026-06-06 14:27:24','2026-06-06 14:27:24','0912000007'),
  (8,'testphoneuser6758','$2b$10$.YtAQoBmiQrXFkLGkV4IEuWoIKmDszJdnnObwT8oHwSRcWMDRpLiy','PATIENT','Nguyen Van Test','2026-06-07 04:11:24','2026-06-07 04:11:24','0999888777'),
  (9,'doctor_seed1','$2b$10$cc.Kv.rgD47hc3pGHQQjJOgqKF2UiiFpj/8s6HfsAp2.64Rmmt43m','DOCTOR','BS. Nguyễn Văn Minh','2026-06-07 04:14:53','2026-06-07 04:14:53','0981112222'),
  (10,'doctor_seed2','$2b$10$mzY2lCYwkku.1rLOdr/AGeDRYQ42lHgUirOa6N2E/eVGry21YYRb.','DOCTOR','BS. Lê Thị Thu','2026-06-07 04:14:53','2026-06-07 04:14:53','0983334444'),
  (11,'patient_seed1','$2b$10$Dw3/e/X3o8obdnkL53a8xu6RiTDtJW3b53eVq9GmZTgGIN./S/muO','PATIENT','Nguyễn Văn An','2026-06-07 04:14:53','2026-06-07 04:14:53','0912001001'),
  (12,'patient_seed2','$2b$10$x9CPpl0a0VeK0AOaQKOBg.iC2Dm3ojTjN4.V5KvJEPjHggMnew0jO','PATIENT','Trần Thị Bình','2026-06-07 04:14:53','2026-06-07 04:14:53','0912001002'),
  (13,'patient_seed3','$2b$10$V8t0umWTWFO2zuYE84wpje2gTQJrmy9phU/p9o6ah2kL0NGr51rDO','PATIENT','Lê Văn Cường','2026-06-07 04:14:53','2026-06-07 04:14:53','0912001003'),
  (14,'patient_seed4','$2b$10$318KzBqHUimktFo.UkVVo.IXvSZknOvkHheGbkxEfmdWrnWf6pze2','PATIENT','Phạm Thị Dung','2026-06-07 04:14:53','2026-06-07 04:14:53','0912001004'),
  (15,'patient_seed5','$2b$10$RE3jBVEuqgEcr2cVu18pBO6aTASSmtmh0Xa4DDgs72EiNTiurk576','PATIENT','Hoàng Văn Hải','2026-06-07 04:14:54','2026-06-07 04:14:54','0912001005'),
  (16,'patient_seed6','$2b$10$8tlfXxQDeCfFXt77BMutHeJzBBQWavnr1/gkC9uEWOsxcoxTN1vmm','PATIENT','Vũ Thị Hương','2026-06-07 04:14:54','2026-06-07 04:14:54','0912001006');
UNLOCK TABLES;

--
-- Table structure for table `Devices`
--

DROP TABLE IF EXISTS `Devices`;
CREATE TABLE `devices` (
  `mac_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`mac_address`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `devices_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Devices`
--

LOCK TABLES `Devices` WRITE;
INSERT INTO `Devices` VALUES 
  ('11:22:33:44:55:66',8,'2026-06-07 04:11:24','2026-06-07 04:11:24'),
  ('80:F3:DA:41:35:98',1,'2026-05-29 14:33:31','2026-05-29 14:33:31'),
  ('aa:bb:cc:dd',2,'2026-06-06 04:11:02','2026-06-06 04:11:02'),
  ('AA:BB:CC:DD:EE:11',11,'2026-06-07 04:14:53','2026-06-07 04:14:53'),
  ('AA:BB:CC:DD:EE:12',12,'2026-06-07 04:14:53','2026-06-07 04:14:53'),
  ('AA:BB:CC:DD:EE:13',13,'2026-06-07 04:14:53','2026-06-07 04:14:53'),
  ('AA:BB:CC:DD:EE:14',14,'2026-06-07 04:14:54','2026-06-07 04:14:54'),
  ('AA:BB:CC:DD:EE:15',15,'2026-06-07 04:14:54','2026-06-07 04:14:54'),
  ('AA:BB:CC:DD:EE:16',16,'2026-06-07 04:14:54','2026-06-07 04:14:54'),
  ('ESP32-DEMO-01',1,'2026-06-06 14:55:49','2026-06-06 14:55:49'),
  ('TEST',6,'2026-06-06 14:55:04','2026-06-06 14:55:04');
UNLOCK TABLES;

--
-- Table structure for table `HealthRecords`
--

DROP TABLE IF EXISTS `HealthRecords`;
CREATE TABLE `healthrecords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `bpm` int DEFAULT NULL,
  `spo2` int DEFAULT NULL,
  `ecg_file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ai_diagnosis` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `ai_diagnosis_code` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `doctor_confirm` tinyint(1) DEFAULT '0',
  `doctor_advise` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `healthrecords_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `HealthRecords`
--

LOCK TABLES `HealthRecords` WRITE;
INSERT INTO `HealthRecords` VALUES 
  (3,1,161,99,'/uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"PAC/APC (Ngoai tam thu nhi)","confidence":0.46590000000000004}','A',0,NULL,'2026-05-29 14:40:23','2026-06-06 04:13:38'),
  (4,1,166,99,'/uploads/ecg/ecg-1780065856637.csv','{"diagnosis":"PVC (Ngoai tam thu that)","confidence":0.6694}','V',0,NULL,'2026-05-29 14:44:19','2026-06-06 04:14:09'),
  (5,1,125,99,'/uploads/ecg/ecg-1780066061708.csv','{"diagnosis":"PVC (Ngoai tam thu that)","confidence":0.9386}','V',0,NULL,'2026-05-29 14:47:41','2026-06-06 04:14:55'),
  (6,1,151,100,'/uploads/ecg/ecg-1780066394059.csv','{"diagnosis":"PVC (Ngoai tam thu that)","confidence":0.95}','V',0,NULL,'2026-05-29 14:53:15','2026-06-06 04:12:19'),
  (7,1,78,98,'/uploads/ecg/ecg-1780757749554.csv','{"diagnosis":"PVC (Ngoai tam thu that)","confidence":0.6481}','V',0,NULL,'2026-06-06 14:55:49','2026-06-06 14:56:23'),
  (8,11,65,96,'uploads/ecg/ecg-1780065463772.csv','{"diagnosis":"Normal","confidence":0.96}','NORM',0,NULL,'2026-06-03 07:42:53','2026-06-07 04:14:53'),
  (9,11,91,97,'uploads/ecg/ecg-1780066061708.csv','{"diagnosis":"Normal","confidence":0.91}','NORM',0,NULL,'2026-06-04 06:16:53','2026-06-07 04:14:53'),
  (10,11,77,95,'uploads/ecg/ecg-1780065463772.csv','{"diagnosis":"Normal","confidence":0.88}','NORM',0,NULL,'2026-06-05 07:34:53','2026-06-07 04:14:53'),
  (11,11,64,96,'uploads/ecg/ecg-1780065856637.csv','{"diagnosis":"Bradycardia","confidence":0.92}','BRAD',0,NULL,'2026-06-06 02:41:53','2026-06-07 04:14:53'),
  (12,12,71,99,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Normal","confidence":0.88}','NORM',0,NULL,'2026-06-03 05:39:53','2026-06-07 04:14:53'),
  (13,12,66,98,'uploads/ecg/ecg-1780757749554.csv','{"diagnosis":"Atrial Fibrillation","confidence":0.88}','AFIB',0,NULL,'2026-06-04 07:14:53','2026-06-07 04:14:53'),
  (14,12,83,97,'uploads/ecg/ecg-1780066394059.csv','{"diagnosis":"Normal","confidence":0.93}','NORM',1,'Có hiện tượng rối loạn nhịp nhẹ. Đề nghị hạn chế căng thẳng, đo định kỳ 2 lần/ngày và liên hệ phòng khám nếu thấy khó chịu ở ngực.','2026-06-05 06:58:53','2026-06-07 04:14:53'),
  (15,12,73,94,'uploads/ecg/ecg-1780066061708.csv','{"diagnosis":"Normal","confidence":0.88}','NORM',1,'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.','2026-06-06 04:09:53','2026-06-07 04:14:53'),
  (16,13,94,95,'uploads/ecg/ecg-1780065856637.csv','{"diagnosis":"Normal","confidence":0.86}','NORM',1,'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.','2026-06-03 06:46:53','2026-06-07 04:14:53'),
  (17,13,64,98,'uploads/ecg/ecg-1780065210916.csv','{"diagnosis":"Bradycardia","confidence":0.96}','BRAD',0,NULL,'2026-06-04 08:50:53','2026-06-07 04:14:53'),
  (18,13,95,99,'uploads/ecg/ecg-1780064900737.csv','{"diagnosis":"Atrial Fibrillation","confidence":0.98}','AFIB',1,'Kết quả đo ổn định, hãy tiếp tục duy trì chế độ sinh hoạt và luyện tập điều độ.','2026-06-05 01:21:53','2026-06-07 04:14:53'),
  (19,13,61,95,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Bradycardia","confidence":0.85}','BRAD',1,'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.','2026-06-06 07:06:53','2026-06-07 04:14:53'),
  (20,14,63,97,'uploads/ecg/ecg-1780757749554.csv','{"diagnosis":"Bradycardia","confidence":0.96}','BRAD',0,NULL,'2026-06-03 08:55:54','2026-06-07 04:14:54'),
  (21,14,63,96,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Bradycardia","confidence":0.87}','BRAD',1,'Kết quả đo ổn định, hãy tiếp tục duy trì chế độ sinh hoạt và luyện tập điều độ.','2026-06-04 01:02:54','2026-06-07 04:14:54'),
  (22,14,86,95,'uploads/ecg/ecg-1780065210916.csv','{"diagnosis":"Normal","confidence":0.94}','NORM',1,'Kết quả đo ổn định, hãy tiếp tục duy trì chế độ sinh hoạt và luyện tập điều độ.','2026-06-05 02:16:54','2026-06-07 04:14:54'),
  (23,14,93,95,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Atrial Fibrillation","confidence":0.91}','AFIB',1,'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.','2026-06-06 04:08:54','2026-06-07 04:14:54'),
  (24,15,100,94,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Normal","confidence":0.99}','NORM',1,'Kết quả đo ổn định, hãy tiếp tục duy trì chế độ sinh hoạt và luyện tập điều độ.','2026-06-03 02:00:54','2026-06-07 04:14:54'),
  (25,15,60,99,'uploads/ecg/ecg-1780757749554.csv','{"diagnosis":"Bradycardia","confidence":0.89}','BRAD',0,NULL,'2026-06-04 01:11:54','2026-06-07 04:14:54'),
  (26,15,63,95,'uploads/ecg/ecg-1780065210916.csv','{"diagnosis":"Bradycardia","confidence":0.85}','BRAD',1,'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.','2026-06-05 05:00:54','2026-06-07 04:14:54'),
  (27,15,95,97,'uploads/ecg/ecg-1780065856637.csv','{"diagnosis":"Normal","confidence":0.97}','NORM',1,'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.','2026-06-06 05:59:54','2026-06-07 04:14:54'),
  (28,16,95,98,'uploads/ecg/ecg-1780066394059.csv','{"diagnosis":"Normal","confidence":0.91}','NORM',1,'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.','2026-06-03 03:13:54','2026-06-07 04:14:54'),
  (29,16,95,94,'uploads/ecg/ecg-1780065622875.csv','{"diagnosis":"Normal","confidence":0.88}','NORM',1,'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.','2026-06-04 07:05:54','2026-06-07 04:14:54'),
  (30,16,81,94,'uploads/ecg/ecg-1780065463772.csv','{"diagnosis":"Normal","confidence":0.93}','NORM',1,'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.','2026-06-05 03:06:54','2026-06-07 04:14:54'),
  (31,16,68,99,'uploads/ecg/ecg-1780065856637.csv','{"diagnosis":"Normal","confidence":0.86}','NORM',1,'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.','2026-06-06 01:03:54','2026-06-07 04:14:54');
UNLOCK TABLES;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
