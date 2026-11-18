-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: crm_sales
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
-- Current Database: `crm_sales`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `crm_sales` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `crm_sales`;

--
-- Table structure for table `deal_products`
--

DROP TABLE IF EXISTS `deal_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_products` (
  `deal_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` int DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`deal_id`,`product_id`),
  KEY `fk_deal_products_product` (`product_id`),
  CONSTRAINT `fk_deal_products_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`),
  CONSTRAINT `fk_deal_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_products`
--

LOCK TABLES `deal_products` WRITE;
/*!40000 ALTER TABLE `deal_products` DISABLE KEYS */;
INSERT INTO `deal_products` VALUES (1,1,2,5000.00),(2,2,1,12000.00),(3,3,2,25000.00),(4,1,3,5000.00),(5,3,1,25000.00),(6,5,2,8000.00),(7,5,3,8000.00),(8,2,2,12000.00),(9,3,2,25000.00),(10,7,2,9000.00),(11,4,2,3500.00),(12,6,3,6500.00),(13,6,2,6500.00),(14,3,3,25000.00),(15,8,4,2000.00),(16,5,2,8000.00),(17,8,3,2000.00),(18,10,2,3000.00),(19,6,2,6500.00),(20,9,2,4000.00),(21,4,3,3500.00),(22,5,2,8000.00),(23,7,3,9000.00),(24,2,2,12000.00),(25,8,2,2000.00);
/*!40000 ALTER TABLE `deal_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `amount` decimal(12,2) DEFAULT '0.00',
  `stage` enum('prospect','proposal','negotiation','won','lost') DEFAULT 'prospect',
  `lost_reason` varchar(200) DEFAULT NULL,
  `expected_close` date DEFAULT NULL,
  `owner_user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deals_stage` (`stage`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` VALUES (1,1,'CRM Implementation',50000.00,'proposal',NULL,'2026-12-15',2,'2026-11-12 16:26:51',NULL),(2,2,'Software Subscription',35000.00,'negotiation',NULL,'2026-12-20',3,'2026-11-12 16:26:51',NULL),(3,3,'ERP Integration',75000.00,'prospect',NULL,'2027-01-10',2,'2026-11-12 16:26:51',NULL),(4,4,'Retail CRM Package',25000.00,'won',NULL,'2026-11-01',3,'2026-11-12 16:26:51',NULL),(5,5,'Healthcare CRM',60000.00,'proposal',NULL,'2026-12-25',2,'2026-11-12 16:26:51',NULL),(6,6,'Engineering Automation',45000.00,'negotiation',NULL,'2026-12-18',3,'2026-11-12 16:26:51',NULL),(7,7,'Finance Analytics',80000.00,'prospect',NULL,'2027-01-15',2,'2026-11-12 16:26:51',NULL),(8,8,'Electronics CRM',30000.00,'won',NULL,'2026-10-25',3,'2026-11-12 16:26:51',NULL),(9,9,'Construction CRM',55000.00,'proposal',NULL,'2027-01-05',2,'2026-11-12 16:26:51',NULL),(10,10,'Marketing Automation',40000.00,'negotiation',NULL,'2026-12-22',3,'2026-11-12 16:26:51',NULL),(11,11,'Food Industry CRM',28000.00,'prospect',NULL,'2027-01-20',2,'2026-11-12 16:26:51',NULL),(12,12,'Logistics Management',65000.00,'proposal',NULL,'2027-01-12',3,'2026-11-12 16:26:51',NULL),(13,13,'Medical Support System',42000.00,'won',NULL,'2026-10-30',2,'2026-11-12 16:26:51',NULL),(14,14,'Enterprise CRM',90000.00,'negotiation',NULL,'2027-02-01',3,'2026-11-12 16:26:51',NULL),(15,15,'Textile Management',32000.00,'prospect',NULL,'2027-01-25',2,'2026-11-12 16:26:51',NULL),(16,1,'Advanced Analytics',22000.00,'proposal',NULL,'2027-02-05',3,'2026-11-12 16:26:51',NULL),(17,2,'Cloud Storage Upgrade',15000.00,'won',NULL,'2026-11-05',2,'2026-11-12 16:26:51',NULL),(18,3,'Technical Support Plan',18000.00,'negotiation',NULL,'2027-01-30',3,'2026-11-12 16:26:51',NULL),(19,5,'Customer Service Module',27000.00,'prospect',NULL,'2027-02-10',2,'2026-11-12 16:26:51',NULL),(20,6,'Training and Onboarding',12000.00,'lost','Budget constraints','2026-10-15',3,'2026-11-12 16:26:51',NULL),(21,8,'Email Marketing Package',20000.00,'proposal',NULL,'2027-02-15',2,'2026-11-12 16:26:51',NULL),(22,10,'Sales Dashboard',38000.00,'won',NULL,'2026-11-08',3,'2026-11-12 16:26:51',NULL),(23,12,'Workflow Automation',48000.00,'negotiation',NULL,'2027-02-20',2,'2026-11-12 16:26:51',NULL),(24,14,'Annual CRM Renewal',52000.00,'prospect',NULL,'2027-03-01',3,'2026-11-12 16:26:51',NULL),(25,15,'Inventory Integration',26000.00,'lost','Selected another vendor','2026-10-20',2,'2026-11-12 16:26:51',NULL);
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `gst_rate` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_invoice_items_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
INSERT INTO `invoice_items` VALUES (1,1,'CRM Starter Package',2,5000.00,18.00),(2,2,'CRM Professional Package',1,12000.00,18.00),(3,3,'CRM Enterprise Package',2,25000.00,18.00),(4,4,'CRM Starter Package',3,5000.00,18.00),(5,5,'CRM Enterprise Package',1,25000.00,18.00),(6,6,'Sales Analytics Module',2,8000.00,18.00),(7,7,'Sales Analytics Module',3,8000.00,18.00),(8,8,'CRM Professional Package',2,12000.00,18.00),(9,9,'CRM Enterprise Package',2,25000.00,18.00),(10,10,'Automation Module',2,9000.00,18.00),(11,1,'Email Marketing Tool',1,3500.00,18.00),(12,3,'Cloud Storage Add-on',1,2000.00,18.00),(13,5,'Customer Support Module',1,6500.00,18.00),(14,7,'Training Package',1,4000.00,18.00),(15,9,'Technical Support Package',2,3000.00,18.00);
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(20) DEFAULT NULL,
  `quote_id` int DEFAULT NULL,
  `account_id` int NOT NULL,
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT NULL,
  `gst_amount` decimal(12,2) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `status` enum('draft','pending','partially_paid','paid','overdue','cancelled') DEFAULT 'draft',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `fk_invoices_quote` (`quote_id`),
  KEY `idx_invoices_status` (`status`),
  CONSTRAINT `fk_invoices_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'INV-2026-001',1,1,'2026-11-01','2026-11-15',10000.00,1800.00,11800.00,11800.00,'paid'),(2,'INV-2026-002',2,2,'2026-11-02','2026-11-16',12000.00,2160.00,14160.00,5000.00,'partially_paid'),(3,'INV-2026-003',3,3,'2026-11-03','2026-11-17',50000.00,9000.00,59000.00,0.00,'pending'),(4,'INV-2026-004',4,4,'2026-11-04','2026-11-18',15000.00,2700.00,17700.00,17700.00,'paid'),(5,'INV-2026-005',5,5,'2026-11-05','2026-11-19',25000.00,4500.00,29500.00,10000.00,'partially_paid'),(6,'INV-2026-006',6,6,'2026-11-06','2026-11-20',16000.00,2880.00,18880.00,0.00,'pending'),(7,'INV-2026-007',7,7,'2026-11-07','2026-11-21',24000.00,4320.00,28320.00,0.00,'pending'),(8,'INV-2026-008',8,8,'2026-11-08','2026-11-22',24000.00,4320.00,28320.00,28320.00,'paid'),(9,'INV-2026-009',9,9,'2026-11-09','2026-11-23',50000.00,9000.00,59000.00,0.00,'pending'),(10,'INV-2026-010',10,10,'2026-11-10','2026-11-24',18000.00,3240.00,21240.00,0.00,'pending');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `mode` enum('upi','bank','cheque','cash') DEFAULT NULL,
  `reference` varchar(60) DEFAULT NULL,
  `paid_on` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,11800.00,'upi','PAY-2026-001','2026-11-05'),(2,2,5000.00,'bank','PAY-2026-002','2026-11-06'),(3,4,17700.00,'upi','PAY-2026-003','2026-11-07'),(4,5,10000.00,'bank','PAY-2026-004','2026-11-08'),(5,8,28320.00,'cash','PAY-2026-005','2026-11-09'),(6,3,10000.00,'bank','PAY-2026-006','2026-11-10'),(7,6,5000.00,'cheque','PAY-2026-007','2026-11-11'),(8,9,15000.00,'upi','PAY-2026-008','2026-11-12');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `sku` varchar(40) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `gst_rate` decimal(4,2) DEFAULT '18.00',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'CRM Starter Package','CRM001',5000.00,18.00,1),(2,'CRM Professional Package','CRM002',12000.00,18.00,1),(3,'CRM Enterprise Package','CRM003',25000.00,18.00,1),(4,'Email Marketing Tool','CRM004',3500.00,18.00,1),(5,'Sales Analytics Module','CRM005',8000.00,18.00,1),(6,'Customer Support Module','CRM006',6500.00,18.00,1),(7,'Automation Module','CRM007',9000.00,18.00,1),(8,'Cloud Storage Add-on','CRM008',2000.00,18.00,1),(9,'Training Package','CRM009',4000.00,18.00,1),(10,'Technical Support Package','CRM010',3000.00,18.00,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quote_items`
--

DROP TABLE IF EXISTS `quote_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quote_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `gst_rate` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_quote_items_quote` (`quote_id`),
  KEY `fk_quote_items_product` (`product_id`),
  CONSTRAINT `fk_quote_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_quote_items_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quote_items`
--

LOCK TABLES `quote_items` WRITE;
/*!40000 ALTER TABLE `quote_items` DISABLE KEYS */;
INSERT INTO `quote_items` VALUES (1,1,1,2,5000.00,18.00),(2,1,4,1,3500.00,18.00),(3,2,2,1,12000.00,18.00),(4,3,3,2,25000.00,18.00),(5,4,1,3,5000.00,18.00),(6,5,3,1,25000.00,18.00),(7,6,5,2,8000.00,18.00),(8,7,5,3,8000.00,18.00),(9,8,2,2,12000.00,18.00),(10,9,3,2,25000.00,18.00),(11,10,7,2,9000.00,18.00),(12,10,8,1,2000.00,18.00),(13,5,6,1,6500.00,18.00),(14,7,9,1,4000.00,18.00),(15,9,10,2,3000.00,18.00);
/*!40000 ALTER TABLE `quote_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotes`
--

DROP TABLE IF EXISTS `quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quote_no` varchar(20) DEFAULT NULL,
  `deal_id` int DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `status` enum('draft','sent','accepted','rejected') DEFAULT 'draft',
  `valid_until` date DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_no` (`quote_no`),
  KEY `fk_quotes_deal` (`deal_id`),
  CONSTRAINT `fk_quotes_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotes`
--

LOCK TABLES `quotes` WRITE;
/*!40000 ALTER TABLE `quotes` DISABLE KEYS */;
INSERT INTO `quotes` VALUES (1,'QT-2026-001',1,1,'sent','2026-12-15',10000.00),(2,'QT-2026-002',2,2,'accepted','2026-12-20',12000.00),(3,'QT-2026-003',3,3,'draft','2027-01-10',50000.00),(4,'QT-2026-004',4,4,'accepted','2026-12-10',15000.00),(5,'QT-2026-005',5,5,'sent','2026-12-25',25000.00),(6,'QT-2026-006',6,6,'rejected','2026-12-18',16000.00),(7,'QT-2026-007',7,7,'draft','2027-01-15',24000.00),(8,'QT-2026-008',8,8,'accepted','2026-12-12',24000.00),(9,'QT-2026-009',9,9,'sent','2027-01-05',50000.00),(10,'QT-2026-010',10,10,'draft','2026-12-22',18000.00);
/*!40000 ALTER TABLE `quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `targets`
--

DROP TABLE IF EXISTS `targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `targets` (
  `user_id` int NOT NULL,
  `month` char(7) NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `targets`
--

LOCK TABLES `targets` WRITE;
/*!40000 ALTER TABLE `targets` DISABLE KEYS */;
INSERT INTO `targets` VALUES (1,'2026-11',1000000.00),(2,'2026-11',800000.00),(3,'2026-11',500000.00),(4,'2026-11',300000.00),(5,'2026-11',600000.00);
/*!40000 ALTER TABLE `targets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'crm_sales'
--

--
-- Dumping routines for database 'crm_sales'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-16 19:11:47
