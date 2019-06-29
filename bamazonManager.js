//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
var chalkPipe = require("chalk-pipe");
require('dotenv').config();
//global variables
var itemTotal;
var stockQuantity;
//table
var headers = {
    columns: [
        { field: "id", name: "ID" },
        { field: "product", name: "Product" },
        { field: "department", name: "Department" },
        { field: "price", name: "Price" },
        { field: "stock", name: "Stock" }
    ]
};
var rows = [];
var table;

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
            message: "What action would you like to perform?",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory",
                      "Add New Product", "Exit"],
            name: "action"
        }
    ]).then(function(response) {
        switch(response.action) {
            case "View Products for Sale":
                productDisplay(response.action);
                break;
            case "View Low Inventory":
                lowInventory();
                break;
            case "Add to Inventory":
                productDisplay(response.action);
                break;
            case "Add New Product":
                newProduct();
                break;
            default:
                connection.end();
        }
    })
}

function productDisplay(action) {
    //display current database info in a table
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        //clear table before loop
        rows = [];
        itemTotal = response.length;
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
            pushRows(response[i].item_id, response[i].product_name, response[i].department_name, response[i].price, stockQuantity);
        }
        //create table using the headers and rows
        table = chalkTable(headers, rows);
        //display table on the console
        console.log("\n" + table + "\n");
        //both product display and add inventory should display table,
        //but table will display last due to async
        //added conditionals to split the function path and prevent from creating the same table
        if (action === "View Products for Sale") {
            managerPrompt();
        } else {
            addInventory();
        }
    })
}

function lowInventory() {
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        rows = [];
        for (var i = 0; i < response.length; i++) {
            if (response[i].stock_quantity < 6) {
                if (response[i].stock_quantity === 0) {
                    var lowStock = chalk.red(response[i].stock_quantity);
                } else {
                    var lowStock = chalk.yellow(response[i].stock_quantity);
                }
                pushRows(response[i].item_id, response[i].product_name, response[i].department_name, response[i].price, lowStock);
            }
        }
        table = chalkTable(headers, rows);
        console.log("\n" + table + "\n");
        managerPrompt();
    })
}

function addInventory() {
    inquirer.prompt([
        {
            type: "number",
            message: "What is the ID of the product you would like to restock?",
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
            message: "How many items would you like to add?",
            name: "quantity",
            transformer: function(value) {
                return chalkPipe("blue")(value);
            },
            validate: function(value) {
                var integerCheck = value % 1;
                //if value is a number, if 1 or more items are added, if value is a whole number
                if (!isNaN(value) && value > 0 && integerCheck === 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    ]).then(function(response) {
        checkProduct(response.id, response.quantity);
    })
}

function checkProduct(id, quantity) {
    connection.query("SELECT * FROM products WHERE ?", [
        {
            item_id: id
        }
    ], function(error, response) {
        if (error) throw error;
        var totalStock = response[0].stock_quantity + quantity;
        updateProduct(id, quantity, totalStock, response[0].product_name);
    })
}

function updateProduct(id, quantity, totalQuantity, product) {
    connection.query("UPDATE products SET ? WHERE ?", [
        {
            stock_quantity: totalQuantity
        }, {
            item_id: id
        }
    ], function(error, response) {
        if (error) throw error;
        console.log(chalk.green(`> ${quantity} item(s) have been added to ${product}!`));
        console.log(chalk.yellow(`> ${product} now has a total of ${totalQuantity} item(s).\n`));
        continueAdd();
    })
}

function continueAdd() {
    inquirer.prompt([
        {
            type: "confirm",
            message: "Would you like to add more inventory to another product?",
            name: "confirm"
        }
    ]).then(function(response){
        if (response.confirm) {
            addInventory();
        } else {
            managerPrompt();
        }
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