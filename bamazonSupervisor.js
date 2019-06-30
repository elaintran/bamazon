//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
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
    console.log("");
    supervisorPrompt();
})

function managerPrompt() {
    inquirer.prompt([
        {
            type: "list",
            message: "What type of action would you like to perform?",
            choices: ["View Product Sales by Department", "Create New Department", "Exit"],
            name: "action"
        }
    ]).then(function(response) {
        switch(response.action) {
            case "View Products Sales by Department":
                productSales();
                break;
            case "Create New Department":
                newDepartment();
                break;
            default:
                console.log(chalk.yellow("> Thanks again!\n"));
                connection.end();
        }
    })
}
