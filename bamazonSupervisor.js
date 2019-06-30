//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var chalk = require("chalk");
var chalkTable = require("chalk-table");
require('dotenv').config();
//global variables
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
            var departmentDisplay = {
                id: response[i].department_id,
                name: response[i].department_name,
                overhead: response[i].over_head_costs,
                sales: response[i].product_sales,
                profit: response[i].total_profit
            }
            tableDisplay(departmentDisplay);
        }
        table = chalkTable(headers, rows);
        //display table on the console
        console.log(`\n${table}\n`);
        supervisorPrompt();
    })
}

function tableDisplay(department) {
    //if no sales
    if (department.sales === null) {
        //change null text to n/a
        var productSales = chalk.yellow("N/A");
    //display sales
    } else {
        var productSales = "$" + department.sales;
    }
    //if no profit
    if (department.profit === null) {
        //change null text to n/a
        var totalProfit = chalk.yellow("N/A");
    //if negative profit
    } else if (Math.sign(department.profit) === -1) {
        //change profit to a positive number and move negative sign to front
        var positiveInt = Math.abs(department.profit);
        var totalProfit = chalk.red(`-$${positiveInt}`);
    //if positive profit, display profit
    } else {
        var totalProfit = chalk.green(`+$${department.profit}`);
    }
    pushRows(department.id, department.name, department.overhead, productSales, totalProfit);
}

function pushRows(id, department, overhead, sales, profit) {
    rows.push(
        {
            id: id,
            department: department,
            overhead: "$" + overhead,
            sales: sales,
            profit: profit
        }
    );
}