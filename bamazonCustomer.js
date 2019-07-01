//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
require('dotenv').config();
//global variables
var itemTotal;
var stockQuantity;
var amountSpent = 0;
//table
var headers = {
    columns: [
        { field: "id",  name: "ID" },
        { field: "product",  name: "Product" },
        { field: "department", name: "Department" },
        { field: "price",  name: "Price" },
        { field: "stock",  name: "Stock" }
    ]
};
var rows = [];

//set up a mysql connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "bamazon"
})

//connect to mysql
connection.connect(function(error) {
    if (error) throw error;
    //connection success message
    // console.log("connected as id " + connection.threadId);
    console.log(chalk.yellow("\n> Welcome to Bamazon: The Furniture Edition!"));
    productDisplay();
})

function productDisplay() {
    //display current database info in a table
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        //clear table before loop
        rows = [];
        //assign total number of items to prevent users from
        //picking an id not included from the table
        itemTotal = response.length;
        //loop through database items for specific values
        for (var i = 0; i < response.length; i++) {
            var productDisplay = {
                id: response[i].item_id,
                name: response[i].product_name,
                department: response[i].department_name,
                price: response[i].price,
                stock: response[i].stock_quantity
            }
            tableDisplay(productDisplay);
        }
        //create table using the headers and rows
        var table = chalkTable(headers, rows);
        //display table on the console
        console.log(`${table}\n`);
        purchasePrompt();
    })
}

function tableDisplay(product) {
    var stock = product.stock;
    //red text if out of stock
    if (stock === 0) {
        stockQuantity = chalk.red(stock);
    //yellow text if low stock
    } else if (stock >= 1 && stock < 6) {
        stockQuantity = chalk.yellow(stock);
    //green text if high in quantity
    } else {
        stockQuantity = chalk.green(stock);
    }
    //database items are pushed into an array to display on a table
    pushRows(product.id, product.name, product.department, product.price, stockQuantity);
}

function pushRows(id, product, department, price, stock) {
    rows.push(
        {
            id: id,
            product: product,
            department: department,
            price: "$" + price,
            stock: stock
        }
    );
}

function purchasePrompt() {
    inquirer.prompt([
        {
            type: "number",
            message: "What is the ID of the product you would like to purchase?",
            name: "id",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                //check if value is a decimal
                var integerCheck = value % 1;
                //if value is a number, if it is an number listed as an id, and if value is a whole number
                if (!isNaN(value) && value > 0 && value <= itemTotal && integerCheck === 0) {
                    return true;
                } else {
                    return chalk.red("Please enter a valid ID.");
                }
            }
        }, {
            type: "number",
            message: "How many would you like to purchase?",
            name: "quantity",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                //check if value is a decimal
                var integerCheck = value % 1;
                //if value is a number
                if (!isNaN(value)) {
                    //if 1 or more items are added and if value is a whole number
                    if (value > 0 && integerCheck === 0) {
                        return true;
                    //if value is 0 or a negative number
                    } else if (value <= 0) {
                        return chalk.red("Please enter a valid number.");
                    //if value is a decimal
                    } else if (integerCheck !== 0) {
                        return (chalk.red("Please enter a whole number."));
                    }
                //if value is a string
                } else {
                    return (chalk.red("Please enter a valid number."));
                }
            }
        }
    ]).then(function(response) {
        purchaseProducts(response.id, response.quantity);
    })
}

function purchaseProducts(id, quantity) {
    connection.query("SELECT * FROM products WHERE ?",
    [
        {
            item_id: id
        }
    ], function(error, response) {
        if (error) throw error;
        //check if there is enough quantity
        var totalStock = response[0].stock_quantity - quantity;
        var productSales = response[0].product_sales;
        //if totalStock is a negative number
        if (totalStock < 0) {
            console.log(chalk.red("> Sorry, there aren't enough items! Please try again.\n"));
            //ask user to enter id and quantity again
            purchasePrompt();
        //if totalStock is positive, initiate the purchase
        } else {
            //total of the current purchase
            var totalPrice = quantity * response[0].price;
            var totalSales = productSales + totalPrice;
            //total of all purchases
            amountSpent += totalPrice;
            //update database
            updateTable(id, totalStock, quantity, totalPrice, totalSales);
        }
    })
}

function updateTable(id, totalStock, totalQuantity, totalPrice, totalSales) {
    //use the id to update the stock in the database
    connection.query("UPDATE products SET ? WHERE ?",
    [
        {
            stock_quantity: totalStock,
            product_sales: totalSales
        }, {
            item_id: id
        }
    ], function(error, response) {
        if (error) throw error;
        //amountSpent is updated every time the user purchases a product
        console.log(chalk`{green > ${totalQuantity} item(s) were successfully purchased for a total of $${totalPrice}!}
{yellow > Your total spent is: $${amountSpent}.\n}`);
        continuePurchasePrompt();
    })
}

function continuePurchasePrompt() {
    inquirer.prompt([
        {
            type: "confirm",
            message: "Would you like to make another purchase?",
            name: "confirm",
            transformer: function(value) {
                return chalk.cyan(value);
            }
        }
    ]).then(function(response) {
        if (response.confirm) {
            //empty line between prompt and table
            console.log("");
            productDisplay();
        } else {
            console.log(chalk.yellow("> Thank you for stopping by!\n"));
            connection.end();
        }
    })
}