//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
var chalkPipe = require("chalk-pipe");
//global variables
var itemTotal = 0;
var stockQuantity;
var rows = [];
var amountSpent = 0;

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
    console.log("\nWelcome to Bamazon!");
    productDisplay();
})

function productDisplay() {
    //display current database info in a table
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) {
            console.log(error);
        }
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
        console.log(table + "\n");
        purchasePrompt();
    })
}

function purchasePrompt() {
    inquirer.prompt([
        {
            //when displaying initial table, get the table length and
            //store in variable
            type: "number",
            message: "What is the ID of the product you would like to purchase?",
            name: "id",
            transformer: function(value) {
                return chalkPipe("blue")(value);
            },
            validate: function(value) {
                if (!isNaN(value) && value > 0 && value <= itemTotal) {
                    return true;
                } else {
                    return false;
                }
            }
            //need to validate from numbers 1 to table length
            //and if it is a number
        }, {
            type: "number",
            message: "How many would you like to purchase?",
            name: "quantity",
            transformer: function(value) {
                return chalkPipe("blue")(value);
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
        var totalStock = response[0].stock_quantity - quantity;
        if (totalStock <= 0) {
            console.log(chalk.red("> Sorry, there aren't enough items! Please try again.\n"));
            purchasePrompt();
        } else {
            var totalPrice = quantity * response[0].price;
            amountSpent += totalPrice;
            console.log(chalk.green("> " + quantity + " item(s) were successfully purchased for a total of $" + totalPrice + "!"));
            console.log(chalk.yellow("> Your total spent is: $" + amountSpent + ".\n"));
            continuePurchasePrompt();
        }
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
            console.log("");
            productDisplay();
        } else {
            console.log(chalk.yellow("> Thank you for stopping by!"));
            connection.end();
        }
    })
}