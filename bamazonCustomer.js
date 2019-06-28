//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table3");
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
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) {
            console.log(error);
        }
        var table = new Table({
            head: [chalk.white("ID"), chalk.white("Product"),
                   chalk.white("Department"), chalk.white("Price"),
                   chalk.white("Stock")], 
            colWidths: [5, 15, 15, 10, 10]
        });
        var stockQuanity;
        for (var i = 0; i < response.length; i++) {
            // console.log(typeof(response[i].stock_quanity));
            var responseStock = response[i].stock_quanity;
            // stockQuanity.push(responseStock);
            // console.log(stockQuanity);
            if (responseStock === 0) {
                stockQuanity = chalk.red(responseStock);
            } else if (responseStock >= 1 && responseStock < 6) {
                stockQuanity = chalk.yellow(responseStock);
            } else {
                stockQuanity = chalk.green(responseStock);
            }
            table.push(
                [response[i].item_id, response[i].product_name, response[i].department_name,
                "$" + response[i].price, stockQuanity]
            );
        }
        console.log(table.toString());
        connection.end();
    })
}