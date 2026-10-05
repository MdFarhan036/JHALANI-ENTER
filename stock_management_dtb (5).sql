-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 05, 2026 at 11:29 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stock_management_dtb`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `account_name` varchar(150) NOT NULL,
  `account_type` enum('CASH','BANK','UPI','OTHER') NOT NULL DEFAULT 'CASH',
  `account_number` varchar(100) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `opening_balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `account_name`, `account_type`, `account_number`, `bank_name`, `opening_balance`, `status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'hdfc bank account', 'CASH', '787897987878978789', 'hdfc bank account', 50000.00, 1, NULL, 1, '2026-10-02 17:22:29', '2026-10-02 17:22:29');

-- --------------------------------------------------------

--
-- Table structure for table `account_transactions`
--

CREATE TABLE `account_transactions` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `transaction_no` varchar(50) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('CREDIT','DEBIT','TRANSFER') NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `related_account_id` int(11) DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `deduct_from_salary` tinyint(1) NOT NULL DEFAULT 0,
  `salary_month` date DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account_transactions`
--

INSERT INTO `account_transactions` (`id`, `account_id`, `transaction_no`, `transaction_date`, `transaction_type`, `amount`, `category`, `description`, `reference_no`, `related_account_id`, `employee_id`, `deduct_from_salary`, `salary_month`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, '2026-10-02', 'DEBIT', 1000.00, 'salary', NULL, '87897', NULL, 1, 0, NULL, 1, 1, '2026-10-02 17:40:46', '2026-10-02 17:40:46');

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `module` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `reference_type` varchar(100) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `category_code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `category_code`, `name`, `code`, `description`, `parent_id`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '', 'Category 1', 'CAT0001', NULL, NULL, 0, NULL, '2026-10-03 14:45:37', '2026-10-03 14:45:37');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_assignments`
--

CREATE TABLE `delivery_assignments` (
  `id` int(11) NOT NULL,
  `dispatch_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `party_id` int(11) NOT NULL,
  `delivery_person_id` int(11) DEFAULT NULL,
  `delivery_address` text NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `contact_number` varchar(30) DEFAULT NULL,
  `vehicle_number` varchar(50) DEFAULT NULL,
  `assigned_date` date DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'READY_FOR_DELIVERY',
  `started_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `delivery_remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_otp`
--

CREATE TABLE `delivery_otp` (
  `id` int(11) NOT NULL,
  `delivery_assignment_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `verified_at` datetime DEFAULT NULL,
  `verification_attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_tracking`
--

CREATE TABLE `delivery_tracking` (
  `id` int(11) NOT NULL,
  `delivery_assignment_id` int(11) NOT NULL,
  `status` enum('READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `location_address` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `tracked_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `department_code` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `department_code`, `name`, `description`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'ADMIN', 'Administration', 'Administrative operations', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(2, 'SALES', 'Sales', 'Sales and customer management', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(3, 'ACCOUNTS', 'Accounts', 'Accounting and financial operations', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(4, 'PURCHASE', 'Purchase', 'Purchase and supplier management', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(5, 'STORE', 'Store', 'Inventory and warehouse operations', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(6, 'DISPATCH', 'Dispatch', 'Dispatch and logistics operations', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05'),
(7, 'HR', 'Human Resources', 'Employee and HR management', 1, NULL, '2026-10-02 15:54:05', '2026-10-02 15:54:05');

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `designations`
--

INSERT INTO `designations` (`id`, `department_id`, `name`, `code`, `description`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 7, 'HR', 'HR', NULL, 1, 1, '2026-10-02 17:06:26', '2026-10-02 17:06:26');

-- --------------------------------------------------------

--
-- Table structure for table `dispatches`
--

CREATE TABLE `dispatches` (
  `id` int(11) NOT NULL,
  `dispatch_no` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `party_id` int(11) NOT NULL,
  `dispatch_date` date NOT NULL,
  `delivery_address` text DEFAULT NULL,
  `transporter_name` varchar(150) DEFAULT NULL,
  `vehicle_number` varchar(50) DEFAULT NULL,
  `lr_gr_number` varchar(100) DEFAULT NULL,
  `lr_gr_date` date DEFAULT NULL,
  `eway_bill_number` varchar(100) DEFAULT NULL,
  `dispatch_by` int(11) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','READY','DISPATCHED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dispatches`
--

INSERT INTO `dispatches` (`id`, `dispatch_no`, `order_id`, `party_id`, `dispatch_date`, `delivery_address`, `transporter_name`, `vehicle_number`, `lr_gr_number`, `lr_gr_date`, `eway_bill_number`, `dispatch_by`, `remarks`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'DISP-00001', 2, 2, '2026-10-05', 'Tilaiyatand Near Jama Masjid\nChandwa', 'TP1', 'RJ14HH8552', 'NA', '2026-10-06', 'NA', NULL, 'EWFWEF', 'DELIVERED', 1, '2026-10-05 20:41:34', '2026-10-05 20:44:29');

-- --------------------------------------------------------

--
-- Table structure for table `dispatch_items`
--

CREATE TABLE `dispatch_items` (
  `id` int(11) NOT NULL,
  `dispatch_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dispatch_items`
--

INSERT INTO `dispatch_items` (`id`, `dispatch_id`, `order_item_id`, `variant_id`, `quantity`, `description`, `created_at`) VALUES
(1, 1, 1, 1, 5.000, '500GM PACK', '2026-10-05 20:41:34');

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `driver_code` varchar(50) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `transporter_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `alternate_mobile` varchar(30) DEFAULT NULL,
  `license_no` varchar(50) DEFAULT NULL,
  `license_type` varchar(50) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `employee_code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `basic_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `bank_name` varchar(150) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(30) DEFAULT NULL,
  `pan_number` varchar(30) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `father_name` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `user_id`, `department_id`, `employee_code`, `name`, `department`, `designation`, `mobile`, `email`, `joining_date`, `basic_salary`, `bank_name`, `account_number`, `ifsc_code`, `pan_number`, `remarks`, `status`, `created_by`, `created_at`, `updated_at`, `first_name`, `last_name`, `father_name`) VALUES
(1, NULL, 1, 'JE0001', 'MD FARHAN', NULL, 'HR', '7488210403', 'mdfarhan2886@gmail.com', '2023-01-01', 50000.00, 'NA', 'NA', 'NA', 'NA', NULL, 1, 1, '2026-10-02 17:08:13', '2026-10-02 17:08:13', NULL, NULL, NULL),
(2, NULL, 1, 'GEC0001', 'Farhan', NULL, 'ADMIN', '877897878', 'admin@jhalani.com', '2026-10-05', 50000.00, NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-10-04 20:18:24', '2026-10-04 20:18:24', 'Farhan', 'Gedu', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employee_expenses`
--

CREATE TABLE `employee_expenses` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `expense_type` varchar(100) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `deduct_from_salary` tinyint(1) NOT NULL DEFAULT 0,
  `salary_month` date DEFAULT NULL,
  `deduction_status` enum('PENDING','DEDUCTED','NOT_APPLICABLE') NOT NULL DEFAULT 'NOT_APPLICABLE',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_expenses`
--

INSERT INTO `employee_expenses` (`id`, `employee_id`, `account_id`, `transaction_id`, `expense_date`, `expense_type`, `amount`, `description`, `reference_no`, `deduct_from_salary`, `salary_month`, `deduction_status`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-10-02', 'salary', 1000.00, NULL, '87897', 0, NULL, 'NOT_APPLICABLE', 1, 1, '2026-10-02 17:40:46', '2026-10-02 17:40:46');

-- --------------------------------------------------------

--
-- Table structure for table `employee_salaries`
--

CREATE TABLE `employee_salaries` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `salary_month` date NOT NULL,
  `basic_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `allowances` decimal(14,2) NOT NULL DEFAULT 0.00,
  `credit_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `debit_total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_date` date DEFAULT NULL,
  `payment_mode` enum('CASH','BANK','UPI','OTHER') DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` enum('DRAFT','PROCESSED','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_transactions`
--

CREATE TABLE `employee_transactions` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `salary_id` int(11) DEFAULT NULL,
  `transaction_no` varchar(50) NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('CREDIT','DEBIT') NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `description` text DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `notification_type` varchar(50) NOT NULL DEFAULT 'INFO',
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `party_id` int(11) NOT NULL,
  `order_source` enum('PARTY_ORDER','COMPANY_CREATED') NOT NULL DEFAULT 'PARTY_ORDER',
  `po_number` varchar(100) DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `order_date` date NOT NULL,
  `delivery_address` text DEFAULT NULL,
  `delivery_contact_person` varchar(150) DEFAULT NULL,
  `delivery_contact_number` varchar(30) DEFAULT NULL,
  `delivery_instructions` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','CONFIRMED','PARTIALLY_DISPATCHED','FULLY_DISPATCHED','CANCELLED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `total_quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_no`, `party_id`, `order_source`, `po_number`, `po_date`, `reference_number`, `order_date`, `delivery_address`, `delivery_contact_person`, `delivery_contact_number`, `delivery_instructions`, `remarks`, `status`, `total_quantity`, `total_amount`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(2, 'ORD-00001', 2, 'PARTY_ORDER', 'po0001', '2026-10-06', 'na', '2026-10-05', 'Tilaiyatand Near Jama Masjid\nChandwa', 'MD FARHAN', '78875447877', 'ferg', 'wefwfwe', 'PARTIALLY_DISPATCHED', 50.000, 27500.00, 1, 1, '2026-10-05 19:47:05', '2026-10-05 20:41:34');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `ordered_quantity` decimal(14,3) NOT NULL,
  `dispatched_quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `pending_quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `variant_id`, `description`, `ordered_quantity`, `dispatched_quantity`, `pending_quantity`, `rate`, `amount`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '500GM PACK', 50.000, 5.000, 45.000, 550.00, 27500.00, '2026-10-05 19:47:05', '2026-10-05 20:41:34');

-- --------------------------------------------------------

--
-- Table structure for table `parties`
--

CREATE TABLE `parties` (
  `id` int(11) NOT NULL,
  `party_code` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `alternate_mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `delivery_address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `credit_limit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `opening_balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `opening_balance_type` enum('DEBIT','CREDIT') NOT NULL DEFAULT 'DEBIT',
  `remarks` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `parties`
--

INSERT INTO `parties` (`id`, `party_code`, `name`, `contact_person`, `mobile`, `alternate_mobile`, `email`, `gst_no`, `billing_address`, `delivery_address`, `city`, `state`, `pincode`, `credit_limit`, `opening_balance`, `opening_balance_type`, `remarks`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'JE00001', 'MOR', 'WFWEVWE', '797878978978', NULL, 'WFEW@GMAIL.COM', 'NA', 'NA', 'NA', 'NA', 'NA', '088888', 0.00, 0.00, 'DEBIT', NULL, 1, NULL, '2026-10-03 07:05:56', '2026-10-03 07:05:56'),
(2, 'JE00002', 'Farhan Arshad C1', 'Farhan Arshad C1', '78875447877', NULL, 'farhan.geduconnect@gmail.com', 'NA', '72 deep nagar n s road', NULL, 'Jaipur', 'Rajasthan', '302019', 0.00, 0.00, 'DEBIT', NULL, 1, NULL, '2026-10-04 20:18:55', '2026-10-04 20:29:10');

-- --------------------------------------------------------

--
-- Table structure for table `party_payments`
--

CREATE TABLE `party_payments` (
  `id` int(11) NOT NULL,
  `payment_no` varchar(50) NOT NULL,
  `party_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_mode` enum('CASH','BANK','UPI','OTHER') NOT NULL DEFAULT 'CASH',
  `account_id` int(11) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `party_receipts`
--

CREATE TABLE `party_receipts` (
  `id` int(11) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `party_id` int(11) NOT NULL,
  `receipt_date` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_mode` enum('CASH','BANK','UPI','OTHER') NOT NULL DEFAULT 'CASH',
  `account_id` int(11) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_code` varchar(50) NOT NULL,
  `category_id` int(11) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `short_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `temperature_min` decimal(10,2) DEFAULT NULL,
  `temperature_max` decimal(10,2) DEFAULT NULL,
  `temperature_unit` varchar(20) DEFAULT '°C',
  `material_construction` text DEFAULT NULL,
  `catalogue_visible` tinyint(1) NOT NULL DEFAULT 1,
  `brand` varchar(150) DEFAULT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `gst_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `base_unit_id` int(11) DEFAULT NULL,
  `reorder_level` decimal(14,3) NOT NULL DEFAULT 0.000,
  `min_stock` decimal(14,3) NOT NULL DEFAULT 0.000,
  `max_stock` decimal(14,3) NOT NULL DEFAULT 0.000,
  `is_batch_tracked` tinyint(1) NOT NULL DEFAULT 0,
  `is_expiry_tracked` tinyint(1) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `product_code`, `category_id`, `unit_id`, `product_name`, `short_name`, `description`, `temperature_min`, `temperature_max`, `temperature_unit`, `material_construction`, `catalogue_visible`, `brand`, `manufacturer`, `hsn_code`, `gst_rate`, `base_unit_id`, `reorder_level`, `min_stock`, `max_stock`, `is_batch_tracked`, `is_expiry_tracked`, `status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'PROD-1', 1, 33, 'Conduit Round Box', 'Conduit Round Box', NULL, NULL, NULL, '°C', NULL, 1, 'Generic / Brand Not Specified', 'NA', 'NA', 0.00, 33, 0.000, 0.000, 0.000, 0, 0, 1, NULL, NULL, '2026-10-03 15:06:53', '2026-10-03 15:06:53');

-- --------------------------------------------------------

--
-- Table structure for table `product_catalogue_specs`
--

CREATE TABLE `product_catalogue_specs` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `specification_name` varchar(150) NOT NULL,
  `specification_value` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_documents`
--

CREATE TABLE `product_documents` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `document_title` varchar(255) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_title` varchar(255) DEFAULT NULL,
  `image_path` varchar(500) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `variant_name` varchar(200) DEFAULT NULL,
  `pack_size` decimal(14,3) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `purchase_rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sale_rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `mrp` decimal(14,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `opening_stock` decimal(14,3) NOT NULL DEFAULT 0.000,
  `current_stock` decimal(14,3) NOT NULL DEFAULT 0.000,
  `reserved_stock` decimal(14,3) NOT NULL DEFAULT 0.000,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `variant_name`, `pack_size`, `unit_id`, `barcode`, `purchase_rate`, `sale_rate`, `mrp`, `gst_rate`, `opening_stock`, `current_stock`, `reserved_stock`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'qfqfe', '500GM PACK', 50.000, 33, NULL, 500.00, 550.00, 0.00, NULL, 500.000, 0.000, 0.000, 1, NULL, '2026-10-03 15:26:37', '2026-10-05 20:41:34');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `supplier_name` varchar(200) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `purchase_date` datetime NOT NULL DEFAULT current_timestamp(),
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_returns`
--

CREATE TABLE `purchase_returns` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `supplier_name` varchar(200) NOT NULL,
  `return_date` datetime NOT NULL DEFAULT current_timestamp(),
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_return_items`
--

CREATE TABLE `purchase_return_items` (
  `id` int(11) NOT NULL,
  `purchase_return_id` int(11) NOT NULL,
  `purchase_item_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `id` int(11) NOT NULL,
  `quotation_no` varchar(50) NOT NULL,
  `party_id` int(11) NOT NULL,
  `quotation_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `revision_no` int(11) NOT NULL DEFAULT 1,
  `status` enum('DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_terms` text DEFAULT NULL,
  `delivery_terms` text DEFAULT NULL,
  `freight_terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `exclusions` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` (`id`, `quotation_no`, `party_id`, `quotation_date`, `valid_until`, `revision_no`, `status`, `subtotal`, `tax_amount`, `total_amount`, `payment_terms`, `delivery_terms`, `freight_terms`, `notes`, `exclusions`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'QUO-00001', 2, '2026-10-05', '2026-10-06', 1, 'DRAFT', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-05 21:14:03', '2026-10-05 21:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `unit_id` int(11) DEFAULT NULL,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quotation_items`
--

INSERT INTO `quotation_items` (`id`, `quotation_id`, `variant_id`, `description`, `specification`, `quantity`, `unit_id`, `rate`, `tax_rate`, `tax_amount`, `amount`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Conduit Round Box', '500GM PACK', 1.000, 33, 50.00, 0.00, 0.00, 50.00, '2026-10-05 21:14:03', '2026-10-05 21:14:03'),
(2, 1, NULL, NULL, NULL, 1.000, NULL, 0.00, 0.00, 0.00, 0.00, '2026-10-05 21:14:03', '2026-10-05 21:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_revisions`
--

CREATE TABLE `quotation_revisions` (
  `id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `revision_no` int(11) NOT NULL,
  `quotation_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `status` enum('DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_terms` text DEFAULT NULL,
  `delivery_terms` text DEFAULT NULL,
  `freight_terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `exclusions` text DEFAULT NULL,
  `revised_by` int(11) DEFAULT NULL,
  `revised_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quotation_revisions`
--

INSERT INTO `quotation_revisions` (`id`, `quotation_id`, `revision_no`, `quotation_date`, `valid_until`, `status`, `subtotal`, `tax_amount`, `total_amount`, `payment_terms`, `delivery_terms`, `freight_terms`, `notes`, `exclusions`, `revised_by`, `revised_at`) VALUES
(1, 1, 1, '2026-10-05', '2026-10-06', 'DRAFT', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-05 21:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_revision_items`
--

CREATE TABLE `quotation_revision_items` (
  `id` int(11) NOT NULL,
  `revision_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `unit_id` int(11) DEFAULT NULL,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quotation_revision_items`
--

INSERT INTO `quotation_revision_items` (`id`, `revision_id`, `variant_id`, `description`, `specification`, `quantity`, `unit_id`, `rate`, `tax_rate`, `tax_amount`, `amount`) VALUES
(1, 1, 1, 'Conduit Round Box', '500GM PACK', 1.000, 33, 50.00, 0.00, 0.00, 50.00),
(2, 1, NULL, NULL, NULL, 1.000, NULL, 0.00, 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `sales_returns`
--

CREATE TABLE `sales_returns` (
  `id` int(11) NOT NULL,
  `return_no` varchar(50) NOT NULL,
  `order_id` int(11) NOT NULL,
  `party_id` int(11) NOT NULL,
  `return_date` datetime NOT NULL DEFAULT current_timestamp(),
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `reason` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('DRAFT','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_return_items`
--

CREATE TABLE `sales_return_items` (
  `id` int(11) NOT NULL,
  `sales_return_id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `dispatch_item_id` int(11) DEFAULT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_transactions`
--

CREATE TABLE `stock_transactions` (
  `id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `transaction_type` enum('OPENING','PURCHASE','PURCHASE_RETURN','SALE','SALE_RETURN','ADJUSTMENT_IN','ADJUSTMENT_OUT','TRANSFER_IN','TRANSFER_OUT','DAMAGE','EXPIRY') NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `quantity` decimal(14,3) NOT NULL,
  `rate` decimal(14,2) NOT NULL DEFAULT 0.00,
  `transaction_date` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_transactions`
--

INSERT INTO `stock_transactions` (`id`, `variant_id`, `transaction_type`, `reference_type`, `reference_id`, `quantity`, `rate`, `transaction_date`, `remarks`, `created_by`, `created_at`) VALUES
(1, 1, 'OPENING', 'sale', NULL, 50.000, 550.00, '2026-10-03 21:28:00', NULL, 1, '2026-10-03 15:58:51'),
(2, 1, 'ADJUSTMENT_IN', NULL, NULL, 40.000, 500.00, '2026-10-05 23:40:53', NULL, 1, '2026-10-05 18:10:53'),
(3, 1, 'ADJUSTMENT_IN', NULL, NULL, 5.000, 500.00, '2026-10-05 23:43:13', NULL, 1, '2026-10-05 18:13:13');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_group` varchar(100) NOT NULL DEFAULT 'GENERAL',
  `description` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_group`, `description`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'quotation_prefix', 'QUO-', 'GENERAL', NULL, 1, NULL, '2026-10-05 21:14:03', '2026-10-05 21:14:03'),
(2, 'quotation_next_number', '2', 'GENERAL', NULL, 1, NULL, '2026-10-05 21:14:03', '2026-10-05 21:14:03');

-- --------------------------------------------------------

--
-- Table structure for table `transporters`
--

CREATE TABLE `transporters` (
  `id` int(11) NOT NULL,
  `transporter_code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `alternate_mobile` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `payment_terms` varchar(150) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transporters`
--

INSERT INTO `transporters` (`id`, `transporter_code`, `name`, `contact_person`, `mobile`, `alternate_mobile`, `email`, `gst_no`, `address`, `city`, `state`, `pincode`, `payment_terms`, `status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'TP0001', 'TP1', 'TPCP1', '8977897878', NULL, 'tpcp1@gmail.com', 'NA', NULL, NULL, NULL, NULL, '1 DAYS', 1, NULL, 1, '2026-10-04 20:45:31', '2026-10-04 20:45:31');

-- --------------------------------------------------------

--
-- Table structure for table `transport_records`
--

CREATE TABLE `transport_records` (
  `id` int(11) NOT NULL,
  `transport_no` varchar(50) NOT NULL,
  `transporter_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `transport_date` date NOT NULL,
  `from_location` varchar(255) DEFAULT NULL,
  `to_location` varchar(255) DEFAULT NULL,
  `lr_no` varchar(100) DEFAULT NULL,
  `lr_date` date DEFAULT NULL,
  `freight_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `loading_charges` decimal(14,2) NOT NULL DEFAULT 0.00,
  `unloading_charges` decimal(14,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_transport_cost` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` enum('PLANNED','LOADED','IN_TRANSIT','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_vehicles`
--

CREATE TABLE `transport_vehicles` (
  `id` int(11) NOT NULL,
  `transporter_id` int(11) NOT NULL,
  `vehicle_number` varchar(30) NOT NULL,
  `vehicle_type` varchar(100) DEFAULT NULL,
  `driver_name` varchar(150) DEFAULT NULL,
  `driver_mobile` varchar(20) DEFAULT NULL,
  `capacity` decimal(14,3) DEFAULT NULL,
  `capacity_unit` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `unit_code` varchar(30) NOT NULL,
  `name` varchar(100) NOT NULL,
  `symbol` varchar(20) DEFAULT NULL,
  `short_name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `decimal_places` tinyint(4) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `code`, `unit_code`, `name`, `symbol`, `short_name`, `description`, `decimal_places`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(29, 'PCS', 'PCS', 'Piece', 'PCS', 'PCS', 'Individual piece', 0, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(30, 'KG', 'KG', 'Kilogram', 'KG', 'KG', 'Weight in kilograms', 3, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(31, 'GM', 'GM', 'Gram', 'GM', 'GM', 'Weight in grams', 3, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(32, 'M', 'M', 'Meter', 'M', 'M', 'Length in meters', 3, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(33, 'BOX', 'BOX', 'Box', 'BOX', 'BOX', 'Quantity measured by box', 0, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(34, 'LTR', 'LTR', 'Liter', 'L', 'L', 'Volume in liters', 3, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58'),
(35, 'SET', 'SET', 'Set', 'SET', 'SET', 'Complete set', 0, 0, NULL, '2026-10-03 15:00:16', '2026-10-03 15:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','MANAGER','STAFF','ACCOUNTS') NOT NULL DEFAULT 'STAFF',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `email`, `mobile`, `password`, `role`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'admin', 'admin@jhalani.local', NULL, '$2b$12$erF7APZ3ZNwAO2G0eJ7Ft.mA/zmU2Eku9XNXvKr6/NQywbjuZKriu', 'SUPER_ADMIN', 1, NULL, '2026-10-02 15:53:24', '2026-10-02 15:53:24');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `vehicle_no` varchar(30) NOT NULL,
  `transporter_id` int(11) DEFAULT NULL,
  `vehicle_type` enum('TRUCK','PICKUP','TEMPO','TRACTOR','OTHER') NOT NULL DEFAULT 'TRUCK',
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `capacity` decimal(14,3) DEFAULT NULL,
  `capacity_unit` enum('KG','TON','LITRE','OTHER') DEFAULT 'KG',
  `registration_date` date DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `fitness_expiry` date DEFAULT NULL,
  `permit_expiry` date DEFAULT NULL,
  `pollution_expiry` date DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
  `remarks` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `vehicle_no`, `transporter_id`, `vehicle_type`, `model`, `manufacturer`, `capacity`, `capacity_unit`, `registration_date`, `insurance_expiry`, `fitness_expiry`, `permit_expiry`, `pollution_expiry`, `status`, `remarks`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'RJ14HH8552', 1, 'TRUCK', 'MODEL 1', 'MANUF 1', 500.000, 'KG', '2026-10-05', '2027-10-05', NULL, NULL, NULL, 'ACTIVE', NULL, 1, '2026-10-05 16:59:41', '2026-10-05 16:59:41');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_employee_salary_summary`
-- (See below for the actual view)
--
CREATE TABLE `v_employee_salary_summary` (
`employee_id` int(11)
,`employee_code` varchar(50)
,`employee_name` varchar(150)
,`department` varchar(100)
,`designation` varchar(100)
,`salary_id` int(11)
,`salary_month` date
,`basic_salary` decimal(14,2)
,`allowances` decimal(14,2)
,`credit_total` decimal(14,2)
,`debit_total` decimal(14,2)
,`gross_salary` decimal(14,2)
,`net_salary` decimal(14,2)
,`payment_date` date
,`payment_mode` enum('CASH','BANK','UPI','OTHER')
,`payment_reference` varchar(100)
,`salary_status` enum('DRAFT','PROCESSED','PAID','CANCELLED')
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_order_pendency`
-- (See below for the actual view)
--
CREATE TABLE `v_order_pendency` (
`order_id` int(11)
,`order_no` varchar(50)
,`party_id` int(11)
,`party_name` varchar(255)
,`po_number` varchar(100)
,`po_date` date
,`order_date` date
,`order_item_id` int(11)
,`variant_id` int(11)
,`description` text
,`ordered_quantity` decimal(14,3)
,`dispatched_quantity` decimal(14,3)
,`pending_quantity` decimal(15,3)
,`rate` decimal(14,2)
,`amount` decimal(14,2)
,`order_status` enum('DRAFT','CONFIRMED','PARTIALLY_DISPATCHED','FULLY_DISPATCHED','CANCELLED','CLOSED')
);

-- --------------------------------------------------------

--
-- Structure for view `v_employee_salary_summary`
--
DROP TABLE IF EXISTS `v_employee_salary_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_employee_salary_summary`  AS SELECT `e`.`id` AS `employee_id`, `e`.`employee_code` AS `employee_code`, `e`.`name` AS `employee_name`, `e`.`department` AS `department`, `e`.`designation` AS `designation`, `es`.`id` AS `salary_id`, `es`.`salary_month` AS `salary_month`, `es`.`basic_salary` AS `basic_salary`, `es`.`allowances` AS `allowances`, `es`.`credit_total` AS `credit_total`, `es`.`debit_total` AS `debit_total`, `es`.`gross_salary` AS `gross_salary`, `es`.`net_salary` AS `net_salary`, `es`.`payment_date` AS `payment_date`, `es`.`payment_mode` AS `payment_mode`, `es`.`payment_reference` AS `payment_reference`, `es`.`status` AS `salary_status` FROM (`employees` `e` left join `employee_salaries` `es` on(`es`.`employee_id` = `e`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_order_pendency`
--
DROP TABLE IF EXISTS `v_order_pendency`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_order_pendency`  AS SELECT `o`.`id` AS `order_id`, `o`.`order_no` AS `order_no`, `o`.`party_id` AS `party_id`, `p`.`name` AS `party_name`, `o`.`po_number` AS `po_number`, `o`.`po_date` AS `po_date`, `o`.`order_date` AS `order_date`, `oi`.`id` AS `order_item_id`, `oi`.`variant_id` AS `variant_id`, `oi`.`description` AS `description`, `oi`.`ordered_quantity` AS `ordered_quantity`, `oi`.`dispatched_quantity` AS `dispatched_quantity`, greatest(`oi`.`ordered_quantity` - `oi`.`dispatched_quantity`,0) AS `pending_quantity`, `oi`.`rate` AS `rate`, `oi`.`amount` AS `amount`, `o`.`status` AS `order_status` FROM ((`orders` `o` join `parties` `p` on(`p`.`id` = `o`.`party_id`)) join `order_items` `oi` on(`oi`.`order_id` = `o`.`id`)) WHERE `o`.`status` <> 'CANCELLED' ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_accounts_name` (`account_name`),
  ADD KEY `idx_accounts_type` (`account_type`),
  ADD KEY `idx_accounts_status` (`status`);

--
-- Indexes for table `account_transactions`
--
ALTER TABLE `account_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transactions_account` (`account_id`),
  ADD KEY `idx_transactions_date` (`transaction_date`),
  ADD KEY `idx_transactions_type` (`transaction_type`),
  ADD KEY `idx_transactions_employee` (`employee_id`),
  ADD KEY `idx_transactions_reference` (`reference_no`),
  ADD KEY `fk_transaction_related_account` (`related_account_id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_user` (`user_id`),
  ADD KEY `idx_activity_module` (`module`),
  ADD KEY `idx_activity_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_activity_created_at` (`created_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_category_code` (`category_code`),
  ADD UNIQUE KEY `uk_category_name` (`name`),
  ADD KEY `idx_category_parent` (`parent_id`),
  ADD KEY `idx_category_status` (`status`),
  ADD KEY `fk_category_created_by` (`created_by`);

--
-- Indexes for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_delivery_dispatch` (`dispatch_id`),
  ADD KEY `idx_delivery_order` (`order_id`),
  ADD KEY `idx_delivery_party` (`party_id`),
  ADD KEY `idx_delivery_person` (`delivery_person_id`),
  ADD KEY `idx_delivery_status` (`status`);

--
-- Indexes for table `delivery_otp`
--
ALTER TABLE `delivery_otp`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_delivery_otp_assignment` (`delivery_assignment_id`);

--
-- Indexes for table `delivery_tracking`
--
ALTER TABLE `delivery_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tracking_assignment` (`delivery_assignment_id`),
  ADD KEY `idx_tracking_status` (`status`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_department_name` (`name`),
  ADD UNIQUE KEY `uk_department_code` (`department_code`),
  ADD KEY `idx_department_status` (`status`),
  ADD KEY `fk_departments_created_by` (`created_by`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_designation_name` (`name`),
  ADD KEY `idx_designation_department` (`department_id`),
  ADD KEY `idx_designation_status` (`status`);

--
-- Indexes for table `dispatches`
--
ALTER TABLE `dispatches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_dispatch_no` (`dispatch_no`),
  ADD KEY `idx_dispatch_order` (`order_id`),
  ADD KEY `idx_dispatch_party` (`party_id`),
  ADD KEY `idx_dispatch_date` (`dispatch_date`),
  ADD KEY `idx_dispatch_by` (`dispatch_by`),
  ADD KEY `idx_dispatch_status` (`status`);

--
-- Indexes for table `dispatch_items`
--
ALTER TABLE `dispatch_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_dispatch_order_item` (`dispatch_id`,`order_item_id`),
  ADD KEY `idx_dispatch_items_order_item` (`order_item_id`),
  ADD KEY `idx_dispatch_items_variant` (`variant_id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_driver_code` (`driver_code`),
  ADD KEY `idx_driver_employee` (`employee_id`),
  ADD KEY `idx_driver_transporter` (`transporter_id`),
  ADD KEY `idx_driver_status` (`status`),
  ADD KEY `fk_driver_created_by` (`created_by`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_code` (`employee_code`),
  ADD KEY `idx_employee_name` (`name`),
  ADD KEY `idx_employee_department` (`department`),
  ADD KEY `idx_employee_status` (`status`),
  ADD KEY `idx_employees_user_id` (`user_id`),
  ADD KEY `idx_employees_department_id` (`department_id`);

--
-- Indexes for table `employee_expenses`
--
ALTER TABLE `employee_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_expense_employee` (`employee_id`),
  ADD KEY `idx_employee_expense_account` (`account_id`),
  ADD KEY `idx_employee_expense_date` (`expense_date`),
  ADD KEY `idx_employee_expense_salary` (`salary_month`),
  ADD KEY `fk_employee_expense_transaction` (`transaction_id`);

--
-- Indexes for table `employee_salaries`
--
ALTER TABLE `employee_salaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_salary_month` (`employee_id`,`salary_month`),
  ADD KEY `idx_salary_month` (`salary_month`),
  ADD KEY `idx_salary_status` (`status`);

--
-- Indexes for table `employee_transactions`
--
ALTER TABLE `employee_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_transaction_no` (`transaction_no`),
  ADD KEY `idx_employee_transaction_employee` (`employee_id`),
  ADD KEY `idx_employee_transaction_salary` (`salary_id`),
  ADD KEY `idx_employee_transaction_date` (`transaction_date`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_type` (`notification_type`),
  ADD KEY `idx_notifications_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_notifications_created` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_orders_order_no` (`order_no`),
  ADD KEY `idx_orders_party` (`party_id`),
  ADD KEY `idx_orders_po_number` (`po_number`),
  ADD KEY `idx_orders_order_date` (`order_date`),
  ADD KEY `idx_orders_status` (`status`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_order_variant` (`order_id`,`variant_id`),
  ADD KEY `idx_order_items_variant` (`variant_id`);

--
-- Indexes for table `parties`
--
ALTER TABLE `parties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_parties_code` (`party_code`),
  ADD KEY `idx_parties_name` (`name`),
  ADD KEY `idx_parties_mobile` (`mobile`),
  ADD KEY `idx_parties_gst` (`gst_no`);

--
-- Indexes for table `party_payments`
--
ALTER TABLE `party_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_no` (`payment_no`),
  ADD KEY `idx_payment_party` (`party_id`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payment_account` (`account_id`),
  ADD KEY `idx_payment_status` (`status`);

--
-- Indexes for table `party_receipts`
--
ALTER TABLE `party_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_no` (`receipt_no`),
  ADD KEY `idx_receipt_no` (`receipt_no`),
  ADD KEY `idx_party_id` (`party_id`),
  ADD KEY `idx_receipt_date` (`receipt_date`),
  ADD KEY `idx_account_id` (`account_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_product_code` (`product_code`),
  ADD KEY `idx_product_category` (`category_id`),
  ADD KEY `idx_product_name` (`product_name`),
  ADD KEY `idx_product_status` (`status`),
  ADD KEY `idx_product_brand` (`brand`),
  ADD KEY `fk_product_unit` (`base_unit_id`),
  ADD KEY `fk_product_created_by` (`created_by`);

--
-- Indexes for table `product_catalogue_specs`
--
ALTER TABLE `product_catalogue_specs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_catalogue_specs_product` (`product_id`);

--
-- Indexes for table `product_documents`
--
ALTER TABLE `product_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_documents_product` (`product_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product` (`product_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_variant_sku` (`sku`),
  ADD UNIQUE KEY `uk_variant_barcode` (`barcode`),
  ADD KEY `idx_variant_product` (`product_id`),
  ADD KEY `idx_variant_unit` (`unit_id`),
  ADD KEY `idx_variant_status` (`status`),
  ADD KEY `fk_variant_created_by` (`created_by`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_supplier_name` (`supplier_name`),
  ADD KEY `idx_invoice_number` (`invoice_number`),
  ADD KEY `idx_purchase_date` (`purchase_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_id` (`purchase_id`),
  ADD KEY `idx_variant_id` (`variant_id`);

--
-- Indexes for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_id` (`purchase_id`),
  ADD KEY `idx_return_date` (`return_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_return_id` (`purchase_return_id`),
  ADD KEY `idx_purchase_item_id` (`purchase_item_id`),
  ADD KEY `idx_variant_id` (`variant_id`);

--
-- Indexes for table `quotations`
--
ALTER TABLE `quotations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_quotation_no` (`quotation_no`),
  ADD KEY `idx_quotation_party` (`party_id`),
  ADD KEY `idx_quotation_date` (`quotation_date`),
  ADD KEY `idx_quotation_status` (`status`),
  ADD KEY `idx_quotation_valid_until` (`valid_until`),
  ADD KEY `idx_quotation_created_by` (`created_by`);

--
-- Indexes for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quotation_item_quotation` (`quotation_id`),
  ADD KEY `idx_quotation_item_variant` (`variant_id`),
  ADD KEY `idx_quotation_item_unit` (`unit_id`);

--
-- Indexes for table `quotation_revisions`
--
ALTER TABLE `quotation_revisions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_quotation_revision` (`quotation_id`,`revision_no`),
  ADD KEY `idx_revision_quotation` (`quotation_id`);

--
-- Indexes for table `quotation_revision_items`
--
ALTER TABLE `quotation_revision_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_revision_item_revision` (`revision_id`),
  ADD KEY `idx_revision_item_variant` (`variant_id`),
  ADD KEY `idx_revision_item_unit` (`unit_id`);

--
-- Indexes for table `sales_returns`
--
ALTER TABLE `sales_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_sales_return_no` (`return_no`),
  ADD KEY `idx_sales_return_order` (`order_id`),
  ADD KEY `idx_sales_return_party` (`party_id`),
  ADD KEY `idx_sales_return_date` (`return_date`),
  ADD KEY `idx_sales_return_status` (`status`),
  ADD KEY `idx_sales_return_created_by` (`created_by`);

--
-- Indexes for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sales_return_item_return` (`sales_return_id`),
  ADD KEY `idx_sales_return_item_order` (`order_item_id`),
  ADD KEY `idx_sales_return_item_dispatch` (`dispatch_item_id`),
  ADD KEY `idx_sales_return_item_variant` (`variant_id`);

--
-- Indexes for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stock_variant` (`variant_id`),
  ADD KEY `idx_stock_type` (`transaction_type`),
  ADD KEY `idx_stock_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_stock_date` (`transaction_date`),
  ADD KEY `fk_stock_created_by` (`created_by`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_setting_key` (`setting_key`),
  ADD KEY `idx_setting_group` (`setting_group`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `transporters`
--
ALTER TABLE `transporters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_transporter_code` (`transporter_code`),
  ADD KEY `idx_transporter_name` (`name`),
  ADD KEY `idx_transporter_status` (`status`),
  ADD KEY `fk_transporter_created_by` (`created_by`);

--
-- Indexes for table `transport_records`
--
ALTER TABLE `transport_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_transport_no` (`transport_no`),
  ADD KEY `idx_transport_date` (`transport_date`),
  ADD KEY `idx_transport_transporter` (`transporter_id`),
  ADD KEY `idx_transport_vehicle` (`vehicle_id`),
  ADD KEY `idx_transport_driver` (`driver_id`),
  ADD KEY `idx_transport_status` (`status`),
  ADD KEY `fk_transport_created_by` (`created_by`);

--
-- Indexes for table `transport_vehicles`
--
ALTER TABLE `transport_vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_vehicle_number` (`vehicle_number`),
  ADD KEY `idx_vehicle_transporter` (`transporter_id`),
  ADD KEY `idx_vehicle_status` (`status`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_unit_code` (`unit_code`),
  ADD UNIQUE KEY `uk_unit_name` (`name`),
  ADD KEY `fk_unit_created_by` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_users_username` (`username`),
  ADD UNIQUE KEY `uk_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_status` (`status`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_vehicle_no` (`vehicle_no`),
  ADD KEY `idx_vehicle_transporter` (`transporter_id`),
  ADD KEY `idx_vehicle_status` (`status`),
  ADD KEY `fk_vehicle_created_by` (`created_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `account_transactions`
--
ALTER TABLE `account_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_otp`
--
ALTER TABLE `delivery_otp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_tracking`
--
ALTER TABLE `delivery_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dispatches`
--
ALTER TABLE `dispatches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dispatch_items`
--
ALTER TABLE `dispatch_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_expenses`
--
ALTER TABLE `employee_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employee_salaries`
--
ALTER TABLE `employee_salaries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_transactions`
--
ALTER TABLE `employee_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `parties`
--
ALTER TABLE `parties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `party_payments`
--
ALTER TABLE `party_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `party_receipts`
--
ALTER TABLE `party_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `product_catalogue_specs`
--
ALTER TABLE `product_catalogue_specs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_documents`
--
ALTER TABLE `product_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quotations`
--
ALTER TABLE `quotations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quotation_items`
--
ALTER TABLE `quotation_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quotation_revisions`
--
ALTER TABLE `quotation_revisions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quotation_revision_items`
--
ALTER TABLE `quotation_revision_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sales_returns`
--
ALTER TABLE `sales_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transporters`
--
ALTER TABLE `transporters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transport_records`
--
ALTER TABLE `transport_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport_vehicles`
--
ALTER TABLE `transport_vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_transactions`
--
ALTER TABLE `account_transactions`
  ADD CONSTRAINT `fk_transaction_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_related_account` FOREIGN KEY (`related_account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_category_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  ADD CONSTRAINT `fk_delivery_dispatch` FOREIGN KEY (`dispatch_id`) REFERENCES `dispatches` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_delivery_employee` FOREIGN KEY (`delivery_person_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_delivery_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `delivery_otp`
--
ALTER TABLE `delivery_otp`
  ADD CONSTRAINT `fk_delivery_otp_assignment` FOREIGN KEY (`delivery_assignment_id`) REFERENCES `delivery_assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `delivery_tracking`
--
ALTER TABLE `delivery_tracking`
  ADD CONSTRAINT `fk_tracking_assignment` FOREIGN KEY (`delivery_assignment_id`) REFERENCES `delivery_assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `designations`
--
ALTER TABLE `designations`
  ADD CONSTRAINT `fk_designation_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `dispatches`
--
ALTER TABLE `dispatches`
  ADD CONSTRAINT `fk_dispatch_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dispatch_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `dispatch_items`
--
ALTER TABLE `dispatch_items`
  ADD CONSTRAINT `fk_dispatch_items_dispatch` FOREIGN KEY (`dispatch_id`) REFERENCES `dispatches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_dispatch_items_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `fk_driver_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_driver_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_driver_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `employee_expenses`
--
ALTER TABLE `employee_expenses`
  ADD CONSTRAINT `fk_employee_expense_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_expense_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_expense_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `account_transactions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `employee_salaries`
--
ALTER TABLE `employee_salaries`
  ADD CONSTRAINT `fk_salary_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `employee_transactions`
--
ALTER TABLE `employee_transactions`
  ADD CONSTRAINT `fk_employee_transaction_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_transaction_salary` FOREIGN KEY (`salary_id`) REFERENCES `employee_salaries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `party_payments`
--
ALTER TABLE `party_payments`
  ADD CONSTRAINT `fk_party_payments_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `fk_party_payments_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`);

--
-- Constraints for table `party_receipts`
--
ALTER TABLE `party_receipts`
  ADD CONSTRAINT `fk_party_receipts_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_party_receipts_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_product_unit` FOREIGN KEY (`base_unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product_catalogue_specs`
--
ALTER TABLE `product_catalogue_specs`
  ADD CONSTRAINT `fk_catalogue_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_documents`
--
ALTER TABLE `product_documents`
  ADD CONSTRAINT `fk_product_documents_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_variant_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_variant_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `fk_purchase_items_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_purchase_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `purchase_returns`
--
ALTER TABLE `purchase_returns`
  ADD CONSTRAINT `fk_purchase_returns_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `purchase_return_items`
--
ALTER TABLE `purchase_return_items`
  ADD CONSTRAINT `fk_purchase_return_items_purchase_item` FOREIGN KEY (`purchase_item_id`) REFERENCES `purchase_items` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_return_items_return` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `fk_quotation_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD CONSTRAINT `fk_quotation_item_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quotation_item_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quotation_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `quotation_revisions`
--
ALTER TABLE `quotation_revisions`
  ADD CONSTRAINT `fk_revision_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `quotation_revision_items`
--
ALTER TABLE `quotation_revision_items`
  ADD CONSTRAINT `fk_revision_item_revision` FOREIGN KEY (`revision_id`) REFERENCES `quotation_revisions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_revision_item_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_revision_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `sales_returns`
--
ALTER TABLE `sales_returns`
  ADD CONSTRAINT `fk_sales_return_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_sales_return_party` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`);

--
-- Constraints for table `sales_return_items`
--
ALTER TABLE `sales_return_items`
  ADD CONSTRAINT `fk_sales_return_item_dispatch` FOREIGN KEY (`dispatch_item_id`) REFERENCES `dispatch_items` (`id`),
  ADD CONSTRAINT `fk_sales_return_item_order` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  ADD CONSTRAINT `fk_sales_return_item_return` FOREIGN KEY (`sales_return_id`) REFERENCES `sales_returns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sales_return_item_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`);

--
-- Constraints for table `stock_transactions`
--
ALTER TABLE `stock_transactions`
  ADD CONSTRAINT `fk_stock_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `transporters`
--
ALTER TABLE `transporters`
  ADD CONSTRAINT `fk_transporter_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `transport_records`
--
ALTER TABLE `transport_records`
  ADD CONSTRAINT `fk_transport_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transport_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transport_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transport_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `transport_vehicles`
--
ALTER TABLE `transport_vehicles`
  ADD CONSTRAINT `fk_transport_vehicle_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `fk_unit_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `fk_vehicle_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_vehicle_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
