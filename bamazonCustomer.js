//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalkTable = require("chalk-table");
var chalk = require("chalk");
//global variables
var stockQuantity;
var rows = [];

//set up a mysql connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

//connect to mysql
connection.connect(function(error) {
    if (error) {
        console.log(error)
    }
    //connection success message
    // console.log("connected as id " + connection.threadId);
    productDisplay();
})

function productDisplay() {
    //display current database info in a table
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) {
            console.log(error);
        }
        // console.log(chalk.cyan("Welcome") + " to " + chalk.yellow("Bamazon!"));
        console.log("\nWelcome to Bamazon!");
        // console.log("Please check out our current products.");
        //table header
        var headers = {
            //table indent
            // leftPad: 2,
            columns: [
              { field: "id",     name: "ID" },
              { field: "product",  name: "Product" },
              { field: "department", name: "Department" },
              { field: "price",  name: "Price" },
              { field: "stock",  name: "Stock" }
            ]
        };
        //loop through database items for specific values
        for (var i = 0; i < response.length; i++) {
            //change stock number color to red, yellow, or green according to
            //whether the items have ran out, are low, or are high in quantity
            var responseStock = response[i].stock_quantity;
            if (responseStock === 0) {
                stockQuantity = chalk.red(responseStock);
            } else if (responseStock >= 1 && responseStock < 6) {
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
        console.log(table + "\n");
        connection.end();
        shopping();
    })
}

function shopping() {
    inquirer.prompt([
        {
            type: "confirm",
            message: "Is there anything that catches your eye?",
            name: "interest"
        }
    ]).then(function(response) {
        if (response.interest) {
            inquirer.prompt([
                {
                    type: "number",
                    message: "What is the ID of the product you would like to purchase?",
                    name: "id"
                }, {
                    type: "number",
                    message: "How many would you like to purchase?",
                    name: "quantity"
                }
            ]).then(function(response) {
                console.log(response);
            })
        } else {
            console.log("Please come again!");
        }
    })
}