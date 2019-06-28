//node packages
var mysql = require("mysql");
var inquirer = require("inquirer");
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
    console.log("yo");
    connection.end();
})