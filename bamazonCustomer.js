//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
// var Table = require("cli-table3");
var chalkTable = require("chalk-table");
var chalk = require("chalk");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
})

connection.connect(function(error) {
    if (error) {
        console.log(error)
    }
    productDisplay();
    //console.log("yo");
    //connection.end();
})

function productDisplay() {
    console.log();
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) {
            console.log(error);
        }
        console.log(chalk.cyan("Welcome") + " to " + chalk.yellow("Bamazon!"));
        // console.log("Please check out our current products.");
        var options = {
            // leftPad: 2,
            columns: [
              { field: "id",     name: chalk.yellow("ID") },
              { field: "product",  name: chalk.yellow("Product") },
              { field: "department", name: chalk.yellow("Department") },
              { field: "price",  name: chalk.yellow("Price") },
              { field: "stock",  name: chalk.yellow("Stock") }
            ]
        };
        var stockQuantity;
        var rows = [];
        for (var i = 0; i < response.length; i++) {
            // console.log(typeof(response[i].stock_quanity));
            var responseStock = response[i].stock_quantity;
            // stockQuanity.push(responseStock);
            // console.log(stockQuanity);
            if (responseStock === 0) {
                stockQuantity = chalk.red(responseStock);
            } else if (responseStock >= 1 && responseStock < 6) {
                stockQuantity = chalk.yellow(responseStock);
            } else {
                stockQuantity = chalk.green(responseStock);
            }
            // console.log(typeof(stockQuantity));
            rows.push(
                {
                    // id: chalk.blue(response[i].item_id),
                    id: response[i].item_id,
                    product: response[i].product_name,
                    department: response[i].department_name,
                    price: "$" + response[i].price,
                    stock: stockQuantity}
            );
            var table = chalkTable(options, rows);
        }
        console.log(table);
        //(table.toString());
        connection.end();
    })
}