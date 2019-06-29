//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
var chalkPipe = require("chalk-pipe");
require('dotenv').config();
//global variables
var stockQuantity;
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
    if (error) {
        console.log(error)
    }
    //connection success message
    // console.log("connected as id " + connection.threadId);
    managerPrompt();
})

function managerPrompt() {
    inquirer.prompt([
        {
            type: "list",
            message: "Please choose from the following:",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory",
                      "Add New Product", "Exit"],
            name: "action"
        }
    ]).then(function(response) {
        switch(response.action) {
            case "View Products for Sale":
                productDisplay();
                break;
            case "View Low Inventory":
                lowInventory();
                break;
            case "Add to Inventory":
                restock();
                break;
            case "Add New Product":
                newProduct();
                break;
            default:
                connection.end();
        }
    })
}

function productDisplay() {
    //display current database info in a table
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        //table header
        var headers = {
            columns: [
                { field: "id",     name: "ID" },
                { field: "product",  name: "Product" },
                { field: "department", name: "Department" },
                { field: "price",  name: "Price" },
                { field: "stock",  name: "Stock" }
            ]
        };
        //clear table before loop
        rows = [];
        //loop through database items for specific values
        for (var i = 0; i < response.length; i++) {
            //change stock number color to red, yellow, or green according to
            //whether the items have ran out, are low, or are high in quantity
            var responseStock = response[i].stock_quantity;
            if (responseStock === 0) {
                stockQuantity = chalk.red(responseStock);
            } else if (responseStock >= 1 && responseStock < 11) {
                stockQuantity = chalk.yellow(responseStock);
            } else {
                stockQuantity = chalk.green(responseStock);
            }
            //database items are pushed into an array to display on a table
            rows.push(
                {
                    // id: chalk.blue(response[i].item_id),
                    id: response[i].item_id,
                    product: response[i].product_name,
                    department: response[i].department_name,
                    price: "$" + response[i].price,
                    stock: stockQuantity
                }
            );
        }
        //create table using the headers and rows
        var table = chalkTable(headers, rows);
        //display table on the console
        console.log("\n" + table + "\n");
        managerPrompt();
    })
}    