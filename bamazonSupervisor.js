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
        { field: "department", name: "Department" },
        { field: "overhead", name: "Overhead Costs" },
        { field: "sales", name: "Product Sales" },
        { field: "profit", name: "Total Profit" }
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

function supervisorPrompt() {
    inquirer.prompt([
        {
            type: "list",
            message: "What type of action would you like to perform?",
            choices: ["View Product Sales by Department", "Create New Department", "Exit"],
            name: "action"
        }
    ]).then(function(response) {
        switch(response.action) {
            case "View Product Sales by Department":
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

function productSales() {
    //pass department_id, department_name, and overhead cost as table columns
    var selectQuery = "SELECT department_id, departments.department_name, over_head_costs," +
    //department name has the table name infront to specify which header to use
    //using alias to rename product_sales and total_profit
    //if no alias is used, the default name is passed as a header
    "SUM(product_sales) AS product_sales," +
    "product_sales - over_head_costs AS total_profit " +
    //departments is the left table
    "FROM departments " +
    //join by department names
    "INNER JOIN products ON products.department_name = departments.department_name " +
    //merge all of the departments by same name together
    "GROUP BY department_name;";
    connection.query(selectQuery, function(error, response) {
        if (error) throw error;
        row = [];
        for (var i = 0; i < response.length; i++) {
            var overheadCost = "$" + response[i].over_head_costs;
            if (response[i].product_sales === null) {
                var productSales = chalk.yellow("N/A");
            } else {
                var productSales = "$" + response[i].product_sales;
            }
            if (response[i].total_profit === null) {
                var totalProfit = chalk.yellow("N/A");
            } else if (Math.sign(response[i].total_profit) === -1) {
                var totalProfit = chalk.red(`$${response[i].total_profit}`);
            } else {
                var totalProfit = chalk.green(`$${response[i].total_profit}`);
            }
            pushRows(response[i].department_id, response[i].department_name, overheadCost, productSales, totalProfit);
        }
        table = chalkTable(headers, rows);
        //display table on the console
        console.log(`\n${table}\n`);
        supervisorPrompt();
    })
}

function pushRows(id, department, overhead, sales, profit) {
    rows.push(
        {
            id: id,
            department: department,
            overhead: overhead,
            sales: sales,
            profit: profit
        }
    );
}