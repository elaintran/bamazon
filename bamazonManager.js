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
    managerPrompt();
})

function managerPrompt() {
    inquirer.prompt([
        {
            type: "list",
            message: "What type of action would you like to perform?",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory",
                      "Add New Product", "Remove Existing Product", "Exit"],
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
            case "Remove Existing Product":
                productDisplay(response.action);
                break;
            default:
                console.log(chalk.yellow("> Thanks again!\n"));
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
        switch(action) {
            case "View Products for Sale":
                managerPrompt();
                break;
            case "Add to Inventory":
                addInventory();
                break;
            default:
                deletePrompt();
        }
    })
}

function lowInventory() {
    connection.query("SELECT * FROM products", function(error, response) {
        if (error) throw error;
        //clear row
        rows = [];
        for (var i = 0; i < response.length; i++) {
            //if stock is 5 or less
            if (response[i].stock_quantity < 6) {
                //if out of stock, display red
                if (response[i].stock_quantity === 0) {
                    var lowStock = chalk.red(response[i].stock_quantity);
                //if low stock, display yellow
                } else {
                    var lowStock = chalk.yellow(response[i].stock_quantity);
                }
                pushRows(response[i].item_id, response[i].product_name, response[i].department_name, response[i].price, lowStock);
            }
        }
        //update table
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

//check quantity of product before adding additional items
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
            console.log("");
            managerPrompt();
        }
    })
}

function newProduct() {
    inquirer.prompt([
        {
            type: "input",
            message: "What product would you like to add?",
            name: "product",
            transformer: function(value) {
                //capitalize the first letter of every word
                var input = capitalize(value);
                return chalk.cyan(input);
            },
            validate: function(value) {
                //if value is not an empty string
                if (value !== "") {
                    return true;
                } else {
                    return false;
                }
            }
        }, {
            type: "input",
            message: "What department does it belong to?",
            name: "department",
            transformer: function(value) {
                var input = capitalize(value);
                return chalk.cyan(input);
            },
            validate: function(value) {
                //if value is not a number and value is not an empty string
                if (isNaN(value) && value !== "") {
                    return true;
                } else {
                    return false;
                }
            }
        }, {
            type: "number",
            message: "What is the selling price?",
            name: "price",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                //if value is a number
                if (!isNaN(value)) {
                    //convert value into string to find decimal point and use substring
                    var valueString = value.toString();
                    var decimalIndex = valueString.indexOf(".");
                    //if value has a decimal
                    if (decimalIndex !== -1) {
                        //get values first the first and second number after the decimal
                        var pointOne = valueString.substring(decimalIndex + 1, decimalIndex + 3);
                        var pointTwo = valueString.substring(decimalIndex + 1, decimalIndex + 4);
                        //if value has one or two decimal points
                        if(pointOne.length === 1 || pointTwo.length === 2) {
                            return true;
                        } else {
                            //return false if there are more than two decimal points
                            return false;
                        }
                    }
                    //return true if whole number
                    return true;
                } else {
                    return false;
                }
            }
        }, {
            type: "number",
            message: "How many are in stock?",
            name: "stock",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                //return whole numbers only
                var integerCheck = value % 1;
                if (!isNaN(value) && value > 0 && integerCheck === 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    ]).then(function(response) {
        //capitalize first letter in products and department
        var product = capitalize(response.product);
        var department = capitalize(response.department);
        //check if price is a whole number or decimal
        var price;
        var priceString = response.price.toString();
        var decimalIndex = priceString.indexOf(".");
        //if decimal
        if (decimalIndex !== -1) {
            //check how many decimal places
            var decimalLength = priceString.substring(decimalIndex + 1, decimalIndex + 4);
            //if one decimal place
            if (decimalLength.length === 1) {
                //add a 0 to the end
                price = +response.price + "0";
            //print value with two decimal places
            } else {
                price = response.price;
            }
        //print whole number value
        } else {
            price = response.price;
        }
        addProduct(product, department, price, response.stock);
        // connection.end();
    })
}

function addProduct(product, department, price, stock) {
    connection.query("INSERT INTO products SET ?", [
        {
            product_name: product,
            department_name: department,
            price: price,
            stock_quantity: stock
        }
    ], function(error, response) {
        if (error) throw error;
        console.log(chalk.green(`> Successfully added ${product} to the ${department} department!`));
        console.log(chalk.yellow(`> There are currently ${stock} of these item(s) being sold for $${price}.\n`));
        //opted out from including another inquirer that prompts if user would like to
        //add more products because it would take the same time to enter as the managerPrompt
        managerPrompt();
    })
}

function deletePrompt() {
    inquirer.prompt([
        {
            type: "number",
            message: "What is the ID of the product you would like to remove?",
            name: "id",
            transformer: function(value) {
                return chalk.cyan(value);
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
            type: "confirm",
            message: "Are you sure?",
            name: "confirm",
            default: false
        }
    ]).then(function(response) {
        if (response.confirm) {
            deleteProduct();
        } else {
            console.log("");
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

function capitalize(value) {
    var valueArr = value.toLowerCase().split(" ");
    //initially used an empty string, but results in choppy typing movement
    //on the command line
    var newValue = [];
        for (var i = 0; i < valueArr.length; i++) {
            var capitalize = valueArr[i].charAt(0).toUpperCase() + valueArr[i].slice(1);
            newValue.push(capitalize);
        }
    return newValue.join(" ");
}

//maybe add an option to remove items from the list