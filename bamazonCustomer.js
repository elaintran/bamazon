//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
var chalkPipe = require("chalk-pipe");
require('dotenv').config();
//global variables
//table
var headers = {
    columns: [
        { field: "id",     name: "ID" },
        { field: "product",  name: "Product" },
        { field: "department", name: "Department" },
        { field: "price",  name: "Price" },
        { field: "stock",  name: "Stock" }
    ]
};
var rows = [];
var itemTotal = 0;
var stockQuantity;
var amountSpent = 0;

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
    if (error) {
        console.log(error)
    }
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
            //change stock number color to red, yellow, or green according to
            //whether the items have ran out, are low, or are high in quantity
            var responseStock = response[i].stock_quantity;
            if (responseStock === 0) {
                stockQuantity = chalk.red(responseStock);
            } else if (responseStock >= 1 && responseStock < 10) {
                stockQuantity = chalk.yellow(responseStock);
            } else {
                stockQuantity = chalk.green(responseStock);
            }
            //database items are pushed into an array to display on a table
            pushRows(response[i].item_id, response[i].product_name, response[i].department_name, response[i].price, stockQuantity);
        }
        //create table using the headers and rows
        var table = chalkTable(headers, rows);
        //display table on the console
        console.log(table + "\n");
        purchasePrompt();
    })
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
                return chalkPipe("blue")(value);
            },
            validate: function(value) {
                //if value is a number, if it is an number listed as an id, and if value is a whole number
                var integerCheck = value % 1;
                if (!isNaN(value) && value > 0 && value <= itemTotal && integerCheck === 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }, {
            type: "number",
            message: "How many would you like to purchase?",
            name: "quantity",
            transformer: function(value) {
                return chalkPipe("blue")(value);
            },
            validate: function(value) {
                var integerCheck = value % 1;
                //if value is a number, if more than 1 item is purchased, if value is a whole number
                if (!isNaN(value) && value > 0 && integerCheck === 0) {
                    return true;
                } else {
                    return false;
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
        //if totalStock is a negative number
        if (totalStock < 0) {
            console.log(chalk.red("> Sorry, there aren't enough items! Please try again.\n"));
            //ask user to enter id and quantity again
            purchasePrompt();
        //if totalStock is positive, initiate the purchase
        } else {
            //total of the current purchase
            var totalPrice = quantity * response[0].price;
            //total of all purchases
            amountSpent += totalPrice;
            //update database
            updateTable(id, totalStock, quantity, totalPrice);
        }
    })
}

function updateTable(id, totalStock, totalQuantity, totalPrice) {
    //use the id to update the stock in the database
    connection.query("UPDATE products SET ? WHERE ?",
    [
        {
            stock_quantity: totalStock
        }, {
            item_id: id
        }
    ], function(error, response) {
        if (error) throw error;
        console.log(chalk.green(`> ${totalQuantity} item(s) were successfully purchased for a total of $${totalPrice}!`));
        //amountSpent is updated everytime the user purchases a product
        console.log(chalk.yellow(`> Your total spent is: $${amountSpent}.\n`));
        continuePurchasePrompt();
    })
}

function continuePurchasePrompt() {
    inquirer.prompt([
        {
            type: "confirm",
            message: "Would you like to make another purchase?",
            name: "confirm"
        }
    ]).then(function(response) {
        if (response.confirm) {
            //empty line between prompt and table
            console.log("");
            productDisplay();
        } else {
            console.log(chalk.yellow("> Thank you for stopping by!"));
            connection.end();
        }
    })
}