-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: crm_auth
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `crm_auth`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `crm_auth` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `crm_auth`;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `ip`, `created_at`) VALUES (1,1,'USER_CREATED','users','1','127.0.0.1','2026-11-12 16:12:34'),(2,2,'USER_CREATED','users','2','127.0.0.1','2026-11-12 16:12:34'),(3,3,'USER_CREATED','users','3','127.0.0.1','2026-11-12 16:12:34'),(4,4,'USER_CREATED','users','4','127.0.0.1','2026-11-12 16:12:34'),(5,5,'USER_CREATED','users','5','127.0.0.1','2026-11-12 16:12:34');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` (`id`, `code`) VALUES (11,'customers:create'),(14,'customers:delete'),(12,'customers:read'),(13,'customers:update'),(15,'deals:create'),(18,'deals:delete'),(19,'deals:manage'),(16,'deals:read'),(17,'deals:update'),(31,'invoices:approve'),(28,'invoices:create'),(29,'invoices:read'),(30,'invoices:update'),(10,'leads:assign'),(6,'leads:create'),(9,'leads:delete'),(7,'leads:read'),(8,'leads:update'),(32,'payments:create'),(33,'payments:read'),(34,'reports:read'),(5,'roles:manage'),(35,'settings:manage'),(20,'tasks:create'),(23,'tasks:delete'),(21,'tasks:read'),(22,'tasks:update'),(27,'tickets:assign'),(24,'tickets:create'),(25,'tickets:read'),(26,'tickets:update'),(1,'users:create'),(4,'users:delete'),(2,'users:read'),(3,'users:update');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(2,6),(3,6),(1,7),(2,7),(3,7),(1,8),(2,8),(3,8),(1,9),(1,10),(2,10),(1,11),(2,11),(1,12),(2,12),(3,12),(4,12),(5,12),(1,13),(2,13),(1,14),(1,15),(2,15),(3,15),(1,16),(2,16),(3,16),(1,17),(2,17),(3,17),(1,18),(1,19),(2,19),(1,20),(2,20),(3,20),(1,21),(2,21),(3,21),(1,22),(2,22),(3,22),(1,23),(1,24),(4,24),(1,25),(4,25),(1,26),(4,26),(1,27),(4,27),(1,28),(5,28),(1,29),(5,29),(1,30),(5,30),(1,31),(5,31),(1,32),(5,32),(1,33),(5,33),(1,34),(2,34),(5,34),(1,35);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` (`id`, `name`) VALUES (5,'Accounts (Finance)'),(1,'Admin'),(3,'Sales Executive'),(2,'Sales Manager'),(4,'Support Agent');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES (1,'app_name','LeadFlow CRM','2026-11-12 16:17:29'),(2,'default_timezone','Asia/Kolkata','2026-11-12 16:17:29'),(3,'default_currency','INR','2026-11-12 16:17:29'),(4,'default_language','en','2026-11-12 16:17:29'),(5,'session_timeout_minutes','30','2026-11-12 16:17:29');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role_id`, `manager_id`, `is_active`, `created_at`) VALUES (1,'Admin User','admin@leadflow.com','$2b$10$929PX6S4lqbp9raCyEXEHOnpnBMtHN/yPaTdkRL0ADTldDrNqZpiy',1,NULL,1,'2026-11-12 15:37:58'),(2,'Sales Manager','manager@leadflow.com','$2b$10$929PX6S4lqbp9raCyEXEHOnpnBMtHN/yPaTdkRL0ADTldDrNqZpiy',2,NULL,1,'2026-11-12 15:37:58'),(3,'Sales Executive','executive@leadflow.com','$2b$10$929PX6S4lqbp9raCyEXEHOnpnBMtHN/yPaTdkRL0ADTldDrNqZpiy',3,2,1,'2026-11-12 15:37:58'),(4,'Support Agent','support@leadflow.com','$2b$10$929PX6S4lqbp9raCyEXEHOnpnBMtHN/yPaTdkRL0ADTldDrNqZpiy',4,NULL,1,'2026-11-12 15:37:58'),(5,'Accounts User','accounts@leadflow.com','$2b$10$929PX6S4lqbp9raCyEXEHOnpnBMtHN/yPaTdkRL0ADTldDrNqZpiy',5,NULL,1,'2026-11-12 15:37:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `crm_customers`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `crm_customers` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `crm_customers`;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` (`id`, `name`, `industry`, `gstin`, `phone`, `website`, `city`, `state`, `owner_user_id`, `source_lead_id`, `last_activity_at`, `created_at`) VALUES (1,'ABC Technologies','IT Services','33ABCDE1234F1Z5','9876543210','https://abctech.example.com','Coimbatore','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(2,'Bright Solutions','Software','33BCDEF2345G1Z6','9876543211','https://bright.example.com','Chennai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(3,'GreenLeaf Industries','Manufacturing','33CDEFG3456H1Z7','9876543212','https://greenleaf.example.com','Erode','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(4,'Skyline Traders','Retail','33DEFGH4567J1Z8','9876543213','https://skyline.example.com','Salem','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(5,'Prime Healthcare','Healthcare','33EFGHI5678K1Z9','9876543214','https://primehealth.example.com','Chennai','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(6,'Apex Engineering','Engineering','33FGHIJ6789L1Z1','9876543215','https://apex.example.com','Coimbatore','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(7,'Future Finance','Finance','33GHIJK7890M1Z2','9876543216','https://futurefinance.example.com','Bengaluru','Karnataka',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(8,'Nova Electronics','Electronics','33HIJKL8901N1Z3','9876543217','https://nova.example.com','Madurai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(9,'Urban Builders','Construction','33IJKLM9012P1Z4','9876543218','https://urban.example.com','Tiruppur','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(10,'Digital Wings','Digital Marketing','33JKLMN0123Q1Z5','9876543219','https://digitalwings.example.com','Chennai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(11,'Sunrise Foods','Food Processing','33KLMNO1234R1Z6','9876543220','https://sunrise.example.com','Coimbatore','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(12,'Global Logistics','Logistics','33LMNOP2345S1Z7','9876543221','https://globallogistics.example.com','Tiruchirappalli','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(13,'MediCare Plus','Healthcare','33MNOPQ3456T1Z8','9876543222','https://medicare.example.com','Salem','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(14,'TechBridge Systems','IT Services','33NOPQR4567U1Z9','9876543223','https://techbridge.example.com','Coimbatore','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(15,'Evergreen Textiles','Textiles','33OPQRS5678V1Z1','9876543224','https://evergreen.example.com','Erode','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` (`id`, `account_id`, `name`, `title`, `email`, `phone`, `is_primary`) VALUES (1,1,'Arun Kumar','IT Manager','arun@abctech.example.com','9876500001',1),(2,2,'Priya Sharma','Project Manager','priya@bright.example.com','9876500002',1),(3,3,'Karthik Raj','Operations Head','karthik@greenleaf.example.com','9876500003',1),(4,4,'Divya S','Business Owner','divya@skyline.example.com','9876500004',1),(5,5,'Meena Joseph','Hospital Administrator','meena@primehealth.example.com','9876500005',1),(6,6,'Vijay Anand','Engineering Manager','vijay@apex.example.com','9876500006',1),(7,7,'Rahul Verma','Finance Manager','rahul@futurefinance.example.com','9876500007',1),(8,8,'Sneha R','Purchase Manager','sneha@nova.example.com','9876500008',1),(9,9,'Suresh Babu','Project Director','suresh@urban.example.com','9876500009',1),(10,10,'Nithya K','Marketing Head','nithya@digitalwings.example.com','9876500010',1),(11,11,'Ramesh Kumar','Production Manager','ramesh@sunrise.example.com','9876500011',1),(12,12,'Anitha M','Logistics Manager','anitha@globallogistics.example.com','9876500012',1),(13,13,'John Peter','Admin Manager','john@medicare.example.com','9876500013',1),(14,14,'Swetha R','Technical Lead','swetha@techbridge.example.com','9876500014',1),(15,15,'Mohan Das','Sales Manager','mohan@evergreen.example.com','9876500015',1);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `crm_sales`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `crm_sales` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `crm_sales`;

--
-- Dumping data for table `deal_products`
--

LOCK TABLES `deal_products` WRITE;
/*!40000 ALTER TABLE `deal_products` DISABLE KEYS */;
INSERT INTO `deal_products` (`deal_id`, `product_id`, `qty`, `price`) VALUES (1,1,2,5000.00),(2,2,1,12000.00),(3,3,2,25000.00),(4,1,3,5000.00),(5,3,1,25000.00),(6,5,2,8000.00),(7,5,3,8000.00),(8,2,2,12000.00),(9,3,2,25000.00),(10,7,2,9000.00),(11,4,2,3500.00),(12,6,3,6500.00),(13,6,2,6500.00),(14,3,3,25000.00),(15,8,4,2000.00),(16,5,2,8000.00),(17,8,3,2000.00),(18,10,2,3000.00),(19,6,2,6500.00),(20,9,2,4000.00),(21,4,3,3500.00),(22,5,2,8000.00),(23,7,3,9000.00),(24,2,2,12000.00),(25,8,2,2000.00);
/*!40000 ALTER TABLE `deal_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` (`id`, `account_id`, `title`, `amount`, `stage`, `lost_reason`, `expected_close`, `owner_user_id`, `created_at`, `closed_at`) VALUES (1,1,'CRM Implementation',50000.00,'proposal',NULL,'2026-12-15',2,'2026-11-12 16:26:51',NULL),(2,2,'Software Subscription',35000.00,'negotiation',NULL,'2026-12-20',3,'2026-11-12 16:26:51',NULL),(3,3,'ERP Integration',75000.00,'prospect',NULL,'2027-01-10',2,'2026-11-12 16:26:51',NULL),(4,4,'Retail CRM Package',25000.00,'won',NULL,'2026-11-01',3,'2026-11-12 16:26:51',NULL),(5,5,'Healthcare CRM',60000.00,'proposal',NULL,'2026-12-25',2,'2026-11-12 16:26:51',NULL),(6,6,'Engineering Automation',45000.00,'negotiation',NULL,'2026-12-18',3,'2026-11-12 16:26:51',NULL),(7,7,'Finance Analytics',80000.00,'prospect',NULL,'2027-01-15',2,'2026-11-12 16:26:51',NULL),(8,8,'Electronics CRM',30000.00,'won',NULL,'2026-10-25',3,'2026-11-12 16:26:51',NULL),(9,9,'Construction CRM',55000.00,'proposal',NULL,'2027-01-05',2,'2026-11-12 16:26:51',NULL),(10,10,'Marketing Automation',40000.00,'negotiation',NULL,'2026-12-22',3,'2026-11-12 16:26:51',NULL),(11,11,'Food Industry CRM',28000.00,'prospect',NULL,'2027-01-20',2,'2026-11-12 16:26:51',NULL),(12,12,'Logistics Management',65000.00,'proposal',NULL,'2027-01-12',3,'2026-11-12 16:26:51',NULL),(13,13,'Medical Support System',42000.00,'won',NULL,'2026-10-30',2,'2026-11-12 16:26:51',NULL),(14,14,'Enterprise CRM',90000.00,'negotiation',NULL,'2027-02-01',3,'2026-11-12 16:26:51',NULL),(15,15,'Textile Management',32000.00,'prospect',NULL,'2027-01-25',2,'2026-11-12 16:26:51',NULL),(16,1,'Advanced Analytics',22000.00,'proposal',NULL,'2027-02-05',3,'2026-11-12 16:26:51',NULL),(17,2,'Cloud Storage Upgrade',15000.00,'won',NULL,'2026-11-05',2,'2026-11-12 16:26:51',NULL),(18,3,'Technical Support Plan',18000.00,'negotiation',NULL,'2027-01-30',3,'2026-11-12 16:26:51',NULL),(19,5,'Customer Service Module',27000.00,'prospect',NULL,'2027-02-10',2,'2026-11-12 16:26:51',NULL),(20,6,'Training and Onboarding',12000.00,'lost','Budget constraints','2026-10-15',3,'2026-11-12 16:26:51',NULL),(21,8,'Email Marketing Package',20000.00,'proposal',NULL,'2027-02-15',2,'2026-11-12 16:26:51',NULL),(22,10,'Sales Dashboard',38000.00,'won',NULL,'2026-11-08',3,'2026-11-12 16:26:51',NULL),(23,12,'Workflow Automation',48000.00,'negotiation',NULL,'2027-02-20',2,'2026-11-12 16:26:51',NULL),(24,14,'Annual CRM Renewal',52000.00,'prospect',NULL,'2027-03-01',3,'2026-11-12 16:26:51',NULL),(25,15,'Inventory Integration',26000.00,'lost','Selected another vendor','2026-10-20',2,'2026-11-12 16:26:51',NULL);
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` (`id`, `invoice_id`, `description`, `qty`, `price`, `gst_rate`) VALUES (1,1,'CRM Starter Package',2,5000.00,18.00),(2,2,'CRM Professional Package',1,12000.00,18.00),(3,3,'CRM Enterprise Package',2,25000.00,18.00),(4,4,'CRM Starter Package',3,5000.00,18.00),(5,5,'CRM Enterprise Package',1,25000.00,18.00),(6,6,'Sales Analytics Module',2,8000.00,18.00),(7,7,'Sales Analytics Module',3,8000.00,18.00),(8,8,'CRM Professional Package',2,12000.00,18.00),(9,9,'CRM Enterprise Package',2,25000.00,18.00),(10,10,'Automation Module',2,9000.00,18.00),(11,1,'Email Marketing Tool',1,3500.00,18.00),(12,3,'Cloud Storage Add-on',1,2000.00,18.00),(13,5,'Customer Support Module',1,6500.00,18.00),(14,7,'Training Package',1,4000.00,18.00),(15,9,'Technical Support Package',2,3000.00,18.00);
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` (`id`, `invoice_no`, `quote_id`, `account_id`, `issue_date`, `due_date`, `subtotal`, `gst_amount`, `total`, `amount_paid`, `status`) VALUES (1,'INV-2026-001',1,1,'2026-11-01','2026-11-15',10000.00,1800.00,11800.00,11800.00,'paid'),(2,'INV-2026-002',2,2,'2026-11-02','2026-11-16',12000.00,2160.00,14160.00,5000.00,'partially_paid'),(3,'INV-2026-003',3,3,'2026-11-03','2026-11-17',50000.00,9000.00,59000.00,0.00,'pending'),(4,'INV-2026-004',4,4,'2026-11-04','2026-11-18',15000.00,2700.00,17700.00,17700.00,'paid'),(5,'INV-2026-005',5,5,'2026-11-05','2026-11-19',25000.00,4500.00,29500.00,10000.00,'partially_paid'),(6,'INV-2026-006',6,6,'2026-11-06','2026-11-20',16000.00,2880.00,18880.00,0.00,'pending'),(7,'INV-2026-007',7,7,'2026-11-07','2026-11-21',24000.00,4320.00,28320.00,0.00,'pending'),(8,'INV-2026-008',8,8,'2026-11-08','2026-11-22',24000.00,4320.00,28320.00,28320.00,'paid'),(9,'INV-2026-009',9,9,'2026-11-09','2026-11-23',50000.00,9000.00,59000.00,0.00,'pending'),(10,'INV-2026-010',10,10,'2026-11-10','2026-11-24',18000.00,3240.00,21240.00,0.00,'pending');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` (`id`, `invoice_id`, `amount`, `mode`, `reference`, `paid_on`) VALUES (1,1,11800.00,'upi','PAY-2026-001','2026-11-05'),(2,2,5000.00,'bank','PAY-2026-002','2026-11-06'),(3,4,17700.00,'upi','PAY-2026-003','2026-11-07'),(4,5,10000.00,'bank','PAY-2026-004','2026-11-08'),(5,8,28320.00,'cash','PAY-2026-005','2026-11-09'),(6,3,10000.00,'bank','PAY-2026-006','2026-11-10'),(7,6,5000.00,'cheque','PAY-2026-007','2026-11-11'),(8,9,15000.00,'upi','PAY-2026-008','2026-11-12');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `name`, `sku`, `price`, `gst_rate`, `is_active`) VALUES (1,'CRM Starter Package','CRM001',5000.00,18.00,1),(2,'CRM Professional Package','CRM002',12000.00,18.00,1),(3,'CRM Enterprise Package','CRM003',25000.00,18.00,1),(4,'Email Marketing Tool','CRM004',3500.00,18.00,1),(5,'Sales Analytics Module','CRM005',8000.00,18.00,1),(6,'Customer Support Module','CRM006',6500.00,18.00,1),(7,'Automation Module','CRM007',9000.00,18.00,1),(8,'Cloud Storage Add-on','CRM008',2000.00,18.00,1),(9,'Training Package','CRM009',4000.00,18.00,1),(10,'Technical Support Package','CRM010',3000.00,18.00,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `quote_items`
--

LOCK TABLES `quote_items` WRITE;
/*!40000 ALTER TABLE `quote_items` DISABLE KEYS */;
INSERT INTO `quote_items` (`id`, `quote_id`, `product_id`, `qty`, `price`, `gst_rate`) VALUES (1,1,1,2,5000.00,18.00),(2,1,4,1,3500.00,18.00),(3,2,2,1,12000.00,18.00),(4,3,3,2,25000.00,18.00),(5,4,1,3,5000.00,18.00),(6,5,3,1,25000.00,18.00),(7,6,5,2,8000.00,18.00),(8,7,5,3,8000.00,18.00),(9,8,2,2,12000.00,18.00),(10,9,3,2,25000.00,18.00),(11,10,7,2,9000.00,18.00),(12,10,8,1,2000.00,18.00),(13,5,6,1,6500.00,18.00),(14,7,9,1,4000.00,18.00),(15,9,10,2,3000.00,18.00);
/*!40000 ALTER TABLE `quote_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `quotes`
--

LOCK TABLES `quotes` WRITE;
/*!40000 ALTER TABLE `quotes` DISABLE KEYS */;
INSERT INTO `quotes` (`id`, `quote_no`, `deal_id`, `account_id`, `status`, `valid_until`, `total`) VALUES (1,'QT-2026-001',1,1,'sent','2026-12-15',10000.00),(2,'QT-2026-002',2,2,'accepted','2026-12-20',12000.00),(3,'QT-2026-003',3,3,'draft','2027-01-10',50000.00),(4,'QT-2026-004',4,4,'accepted','2026-12-10',15000.00),(5,'QT-2026-005',5,5,'sent','2026-12-25',25000.00),(6,'QT-2026-006',6,6,'rejected','2026-12-18',16000.00),(7,'QT-2026-007',7,7,'draft','2027-01-15',24000.00),(8,'QT-2026-008',8,8,'accepted','2026-12-12',24000.00),(9,'QT-2026-009',9,9,'sent','2027-01-05',50000.00),(10,'QT-2026-010',10,10,'draft','2026-12-22',18000.00);
/*!40000 ALTER TABLE `quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `targets`
--

LOCK TABLES `targets` WRITE;
/*!40000 ALTER TABLE `targets` DISABLE KEYS */;
INSERT INTO `targets` (`user_id`, `month`, `amount`) VALUES (1,'2026-11',1000000.00),(2,'2026-11',800000.00),(3,'2026-11',500000.00),(4,'2026-11',300000.00),(5,'2026-11',600000.00);
/*!40000 ALTER TABLE `targets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-13 12:59:34
