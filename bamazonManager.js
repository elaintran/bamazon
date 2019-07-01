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
            var productDisplay = {
                id: response[i].item_id,
                name: response[i].product_name,
                department: response[i].department_name,
                price: response[i].price,
                stock: response[i].stock_quantity
            }
            tableDisplay(productDisplay);
        }
        //create table using the headers and rows
        table = chalkTable(headers, rows);
        //display table on the console
        console.log(`\n${table}\n`);
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
                console.log(chalk.red("> Sorry, there was an error. Please try again.\n"));
                managerPrompt();
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
        console.log(`\n${table}\n`);
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
                return chalk.cyan(value);
            },
            validate: function(value) {
                //check if value is a decimal
                var integerCheck = value % 1;
                //if value is a number, if it is an number listed as an id, and if value is a whole number
                if (!isNaN(value) && value > 0 && value <= itemTotal && integerCheck === 0) {
                    return true;
                } else {
                    return chalk.red("Please enter a valid ID.");
                }
            }
        }, {
            type: "number",
            message: "How many items would you like to add?",
            name: "quantity",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                var input = validateQuantity(value);
                return input;
            }
        }
    ]).then(function(response) {
        checkQuantity(response.id, response.quantity);
    })
}

//check quantity of product before adding additional items
function checkQuantity(id, quantity) {
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
        console.log(chalk`{green > ${quantity} item(s) have been added to ${product}!}
{yellow > ${product} now has a total of ${totalQuantity} item(s).\n}`);
        managerPrompt();
    })
}

function newProduct() {
    inquirer.prompt([
        {
            type: "input",
            message: "What product do you would you like to add?",
            name: "product",
            transformer: function(value) {
                //capitalize the first letter of every word
                var input = capitalize(value);
                return chalk.cyan(input);
            },
            validate: function(value) {
                var input = inputRestrict(value, "department");
                return input;
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
                var input = inputRestrict(value, "department");
                return input;
            }
        }, {
            type: "number",
            message: "What is the price of this product?",
            name: "price",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                var input = validatePrice(value);
                return input;
            }
        }, {
            type: "number",
            message: "How much would you like add to the stock?",
            name: "stock",
            transformer: function(value) {
                return chalk.cyan(value);
            },
            validate: function(value) {
                var input = validateQuantity(value);
                return input;
            }
        }
    ]).then(function(response) {
        //capitalize first letter in products and department
        var product = capitalize(response.product).trim();
        var department = capitalize(response.department).trim();
        checkProduct(product, department, response.price, response.stock);
    })
}

function checkProduct(product, department, price, stock) {
    connection.query("SELECT * FROM products WHERE ?", [
        {
            product_name: product
        }
    ], function(error, response) {
        if (error) throw error;
        if (response.length === 0) {
            addProduct(product, department, price, stock);
        } else {
            console.log(chalk.red(`> ${product} has already been added. Please try again.\n`));
            newProduct();
        }
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
        console.log(chalk`{green > Successfully added ${product} to the ${department} department!}
{yellow > There are currently ${stock} of these item(s) being sold for $${price}.\n}`);
        managerPrompt();
    })
}

function tableDisplay(product) {
    //change stock number color to red, yellow, or green according to
    //whether the items have ran out, are low, or are high in quantity
    var stock = product.stock;
    if (stock === 0) {
        stockQuantity = chalk.red(stock);
    } else if (stock >= 1 && stock < 6) {
        stockQuantity = chalk.yellow(stock);
    } else {
        stockQuantity = chalk.green(stock);
    }
    //database items are pushed into an array to display on a table
    pushRows(product.id, product.name, product.department, product.price, stockQuantity);
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

function inputRestrict(value, type) {
    //if value is not a number and value is not an empty string
    if (isNaN(value) && value !== "") {
        return true;
    } else if (!isNaN(value)) {
        return chalk.red("Please use words only.");
    } else if (value === "") {
        return chalk.red(`Please enter a ${type}.`);
    } else {
        return false;
    }
}

function validateQuantity(value) {
    var integerCheck = value % 1;
    var valueString = value.toString();
    //if value is a number
    if (!isNaN(value)) {
        //extra security to prevent mysql errors if user inputs an out of range number
        if (valueString.length <= 7) {
            //if 1 or more items are added, if value is a whole number
            if (value > 0 && value < 2001 && integerCheck === 0) {
                return true;
            } else if (value <= 0) {
                return chalk.red("Please enter a valid number.");
            } else if (value > 2000) {
                return chalk.red("The stock limit is 2000. Please try again.");
            } else if (integerCheck !== 0) {
                return (chalk.red("Please enter a whole number."));
            }
        } else {
            return (chalk.red("The stock limit is 2000. Please try again."));
        }
    } else {
        return (chalk.red("Please enter a valid number."));
    }
}

function validatePrice(value) {
    //convert value into string to find decimal point and use substring
    var valueString = value.toString();
    var decimalIndex = valueString.indexOf(".");
    //if value is a number
    if (!isNaN(value) && value > 0) {
        if (valueString.length <= 7) {
            //if value has a decimal
            if (decimalIndex !== -1) {
                //get numbers after the trailing decimal point
                var cents = valueString.substring(decimalIndex + 1, decimalIndex + 4);
                //if value has two decimal points
                if (cents.length === 2) {
                    return true;
                } else {
                    //return false if there is one decimal or more than two decimal points
                    return chalk.red("Please enter a price with two decimal places.");
                }
            }
            if (value > 2000) {
                return chalk.red("The price limit is $2000. Please try again.");
            } else {
                //return true if whole number
                return true;
            }
        } else {
            return (chalk.red("The price limit is $2000. Please try again."));
        }
    //if value is a string
    } else {
        return chalk.red("Please enter a valid price.");
    }
}

//when user adds an product in a department not listed,
//overheadcost = Math.floor(Math.random() * 11) + 1 + "0000"