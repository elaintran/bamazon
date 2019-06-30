-- Create Database
DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE bamazon;
USE bamazon;

-- Bamazon Products Table
CREATE TABLE products (
	item_id INTEGER AUTO_INCREMENT NOT NULL,
    product_name VARCHAR(30) NOT NULL,
    department_name VARCHAR(30) NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER(10) NOT NULL,
    product_sales DECIMAL(10, 2) NULL,
    PRIMARY KEY (item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES
("Shower Basket", "Bathroom", 6, 24),
("Soap Dispenser", "Bathroom", 7, 18),
("Towel Rack", "Bathroom", 30, 10),
("Duvet Covers", "Bedroom", 40, 7),
("Nightstand", "Bedroom", 70, 0),
("Shelf Unit", "Bedroom", 220, 5),
("Flatware Tray", "Kitchen", 8, 50),
("Mini Fridge", "Kitchen", 180, 3),
("Microwave Oven", "Kitchen", 200, 15),
("Bookcase", "Office", 40, 10),
("Desk Lamp", "Office", 20, 30),
("Storage Box", "Office", 6, 25);

-- Display Products
SELECT * FROM products;

-- Departments Table
CREATE TABLE departments (
	department_id INTEGER AUTO_INCREMENT NOT NULL,
    department_name VARCHAR(30) NOT NULL,
    over_head_costs DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (department_id)
);

INSERT INTO departments (department_name, over_head_costs)
VALUE
("Bathroom", 50000),
("Bedroom", 70000),
("Kitchen", 60000),
("Office", 40000);

-- Display Departments
SELECT * FROM departments;

-- Joining Products and Department Tables
SELECT department_id, departments.department_name, over_head_costs,
SUM(product_sales) AS product_sales,
product_sales - over_head_costs AS total_profit
FROM departments
INNER JOIN products ON products.department_name = departments.department_name
GROUP BY department_name;