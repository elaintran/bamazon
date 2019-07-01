# Bamazon
Bamazon is a storefront CLI application that utilizes MySQL for product sales and inventory management. Features include purchasing items, keeping tabs on inventory, adding new products, and tracking sales across departments.

## Install
Clone the repository onto your system.
```
git clone https://github.com/elaintran/bamazon.git
```
Install the node packages.
```
npm install
```

## Usage
Create an `.env` file in the root directory and add your MySQL password.
```
DB_PASSWORD=password
```
Use the following commands to run the application.
```
node bamazonCustomer.js
node bamazonManager.js
node bamazonSupervisor.js
```

## Demo
[View Demo Here]()

## Technologies Used
* [MySQL](https://www.npmjs.com/package/mysql)
* [Inquirer](https://www.npmjs.com/package/inquirer)
* [Chalk](https://www.npmjs.com/package/chalk)
* [Chalk-Table](https://www.npmjs.com/package/chalk-table)