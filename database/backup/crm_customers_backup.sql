-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: crm_customers
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
-- Current Database: `crm_customers`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `crm_customers` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `crm_customers`;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `industry` varchar(60) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `city` varchar(60) DEFAULT NULL,
  `state` varchar(60) DEFAULT NULL,
  `owner_user_id` int NOT NULL,
  `source_lead_id` varchar(24) DEFAULT NULL,
  `last_activity_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'ABC Technologies','IT Services','33ABCDE1234F1Z5','9876543210','https://abctech.example.com','Coimbatore','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(2,'Bright Solutions','Software','33BCDEF2345G1Z6','9876543211','https://bright.example.com','Chennai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(3,'GreenLeaf Industries','Manufacturing','33CDEFG3456H1Z7','9876543212','https://greenleaf.example.com','Erode','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(4,'Skyline Traders','Retail','33DEFGH4567J1Z8','9876543213','https://skyline.example.com','Salem','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(5,'Prime Healthcare','Healthcare','33EFGHI5678K1Z9','9876543214','https://primehealth.example.com','Chennai','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(6,'Apex Engineering','Engineering','33FGHIJ6789L1Z1','9876543215','https://apex.example.com','Coimbatore','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(7,'Future Finance','Finance','33GHIJK7890M1Z2','9876543216','https://futurefinance.example.com','Bengaluru','Karnataka',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(8,'Nova Electronics','Electronics','33HIJKL8901N1Z3','9876543217','https://nova.example.com','Madurai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(9,'Urban Builders','Construction','33IJKLM9012P1Z4','9876543218','https://urban.example.com','Tiruppur','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(10,'Digital Wings','Digital Marketing','33JKLMN0123Q1Z5','9876543219','https://digitalwings.example.com','Chennai','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(11,'Sunrise Foods','Food Processing','33KLMNO1234R1Z6','9876543220','https://sunrise.example.com','Coimbatore','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(12,'Global Logistics','Logistics','33LMNOP2345S1Z7','9876543221','https://globallogistics.example.com','Tiruchirappalli','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(13,'MediCare Plus','Healthcare','33MNOPQ3456T1Z8','9876543222','https://medicare.example.com','Salem','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(14,'TechBridge Systems','IT Services','33NOPQR4567U1Z9','9876543223','https://techbridge.example.com','Coimbatore','Tamil Nadu',3,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04'),(15,'Evergreen Textiles','Textiles','33OPQRS5678V1Z1','9876543224','https://evergreen.example.com','Erode','Tamil Nadu',2,NULL,'2026-11-12 21:51:04','2026-11-12 16:21:04');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `title` varchar(80) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,1,'Arun Kumar','IT Manager','arun@abctech.example.com','9876500001',1),(2,2,'Priya Sharma','Project Manager','priya@bright.example.com','9876500002',1),(3,3,'Karthik Raj','Operations Head','karthik@greenleaf.example.com','9876500003',1),(4,4,'Divya S','Business Owner','divya@skyline.example.com','9876500004',1),(5,5,'Meena Joseph','Hospital Administrator','meena@primehealth.example.com','9876500005',1),(6,6,'Vijay Anand','Engineering Manager','vijay@apex.example.com','9876500006',1),(7,7,'Rahul Verma','Finance Manager','rahul@futurefinance.example.com','9876500007',1),(8,8,'Sneha R','Purchase Manager','sneha@nova.example.com','9876500008',1),(9,9,'Suresh Babu','Project Director','suresh@urban.example.com','9876500009',1),(10,10,'Nithya K','Marketing Head','nithya@digitalwings.example.com','9876500010',1),(11,11,'Ramesh Kumar','Production Manager','ramesh@sunrise.example.com','9876500011',1),(12,12,'Anitha M','Logistics Manager','anitha@globallogistics.example.com','9876500012',1),(13,13,'John Peter','Admin Manager','john@medicare.example.com','9876500013',1),(14,14,'Swetha R','Technical Lead','swetha@techbridge.example.com','9876500014',1),(15,15,'Mohan Das','Sales Manager','mohan@evergreen.example.com','9876500015',1);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'crm_customers'
--

--
-- Dumping routines for database 'crm_customers'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-16 19:10:02
