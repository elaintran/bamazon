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
        //perform action
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
    //need to left join because departments won't display if using inner join
    "LEFT JOIN products ON products.department_name = departments.department_name " +
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

function newDepartment() {
    inquirer.prompt([
        {
            type: "input",
            message: "What department would you like to add?",
            name: "department",
            transformer: function(value) {
                var input = capitalize(value);
                return chalk.cyan(input);
            },
            validate: function(value) {
                //if value is a string and not empty
                if (isNaN(value) && value !== "") {
                    return true;
                //if value is a number
                } else if (!isNaN(value)) {
                    return chalk.red("Please use words only.");
                //if value is an empty string
                } else if (value === "") {
                    return chalk.red("Please enter a department.");
                } else {
                    return false;
                }
            }
        }, {
            type: "number",
            message: "What are the overhead costs?",
            name: "overhead",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                //check if value is a decimal
                var integerCheck = value % 1;
                //if value is a number and has a value of 1 or more
                if (!isNaN(value) && value > 0) {
                    //if value has a decimal
                    if (integerCheck !== 0) {
                        return chalk.red("Please enter a whole number.");
                    }
                    //keep overhead cost at a believable amount
                    if (value >= 1000 && value <= 15000) {
                        return true;
                    } else if (value < 1000) {
                        return chalk.red("The overhead cost should be at least $1000. Please try again.");
                    } else {
                        return chalk.red("The overhead cost limit is $150000. Please try again.");
                    }
                //if value is a string
                } else {
                    return chalk.red("Please enter a valid cost.");
                }
            }
        }
    ]).then(function(response) {
        var department = capitalize(response.department).trim();
        checkDepartment(department, response.overhead);
    })
}

function checkDepartment(department, overhead) {
    connection.query("SELECT * FROM departments WHERE ?", [
        {
            department_name: department
        }
    ], function(error, response) {
        if (error) throw error;
        //if department has not been added yet
        if (response.length === 0) {
            //add department
            addDepartment(department, overhead);
        //if department exists
        } else {
            console.log(chalk.red(`> ${department} already exists. Please try again.\n`));
            newDepartment();
        }
    })
}

function addDepartment(department, overhead) {
    connection.query("INSERT INTO departments SET ?", [
        {
            department_name: department,
            over_head_costs: overhead
        }
    ], function(error, response) {
        if (error) throw error;
        console.log(chalk`{green > Successfully added a new department called ${department}!}\n`);
        supervisorPrompt();
    })
}

function tableDisplay(department) {
    //if no sales
    if (department.sales === null) {
        var productSales = chalk.yellow("N/A");
    //display sales
    } else {
        var productSales = "$" + department.sales;
    }
    //if no profit
    if (department.profit === null) {
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

function capitalize(value) {
    var valueArr = value.toLowerCase().split(" ");
    //initially used an empty string, but results in choppy typing movement
    //on the command line
    var newValue = [];
        for (var i = 0; i < valueArr.length; i++) {
            //capitalize the first letter and add the rest of the string
            var capitalize = valueArr[i].charAt(0).toUpperCase() + valueArr[i].slice(1);
            newValue.push(capitalize);
        }
    return newValue.join(" ");
}