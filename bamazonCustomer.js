var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table2");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Science321!",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) {
    console.error("Error connecting: " + err.stack);
    return;
  }

  console.log("\nWelcome to Bamazon!\n");
  console.log("Here is a complete list of our products.\n");

  displayAllItems();
});

function displayAllItems() 
{
  var queryString = "SELECT * FROM products";

  connection.query(queryString,function(err,res) {
    if (err) throw err;
    var table = new Table({
      head: ["Item ID","Product Name","Department Name","Product Price","Stock Quantity"],
      style: {
        head: [],
        border: []
      }
    });

    for(var i=0;i<res.length;i++)
    {
      table.push(
        [res[i].item_id,res[i].product_name,res[i].department_name,"$"+res[i].price,res[i].stock_quantity]
      );
    }

    console.log(table.toString());

    placeOrder();
  });
}

function placeOrder()
{
  var questions = [
    {
      type: 'input',
      name: 'item_id',
      message: "Which item would you like to purchase? You can identify the item by its Item ID as seen in the table above."
    },
    {
      type: 'input',
      name: 'quantity',
      message: "How many of this item would you like to purchase?"
    }
  ];

  inquirer.prompt(questions).then(function(results) {
    if(parseInt(results.item_id,10)&&parseInt(results.quantity,10))
    {
      var itemId = parseInt(results.item_id,10);
      var quantity = parseInt(results.quantity,10);

      validateOrder(itemId,quantity);
    }
    else
    {
      console.log("This was not a valid number entry. Please enter a number that matches with one of the available items.\n");
      console.log("Review our available items again and place a order using the form below.\n");

      displayAllItems();
    }
  });
}

function validateOrder(item_id,quantityRequested)
{
  var selectedItem;

  var queryString = "SELECT * FROM products";
  connection.query(queryString,function(err,res) {
    if (err) throw err;
    
    for(var i=0;i<res.length;i++)
    {
      if(res[i].item_id===item_id)
      {
        selectedItem=res[i];
        break;
      }
    }

    if(res.length<item_id)
    {
      console.log("This is not a valid Item ID.\n");
      console.log("Please review our available items again and place a new order.\n");
      displayAllItems();
    }
    else if(selectedItem.stock_quantity===0)
    {
      console.log("Insufficient quantity!\n");
      console.log("Please review our available items again and place a new order.\n");
      displayAllItems();
    }
    else if(selectedItem.stock_quantity-quantityRequested<0)
    {
      console.log("Insufficient quantity available for your request!\n");
      console.log("Please choose a quantity equal to or less than the number of items left.\n");
      console.log("Please review our available items again and place a new order.\n");
      displayAllItems();
    }
    else
    {
      var adjustedQuantity=selectedItem.stock_quantity-quantityRequested;

      var queryString = "UPDATE products SET ? WHERE ?";
      connection.query(queryString,[{stock_quantity : adjustedQuantity},{item_id : selectedItem.item_id}],function(err,res) {
        if (err) throw err;

        var totalCost = selectedItem.price*quantityRequested;

        console.log("Order placed!\n");

        console.log("The total price of this order is $"+totalCost+".\n");        

        console.log("What would you like to do now?\n");

        inquirer.prompt({
          name: "appMenuSelection",
          type: "list",
          choices: ["Purchase more items.","Exit Bamazon."],
          message: "What would you like to do now?"
        }).then(function(results) {
          if(results.appMenuSelection==="Purchase more items.") 
          {
            displayAllItems();
          }
          else
          {
            console.log("Closing Bamazon...")
            connection.end();
          }
        });
      });
    } 
  });
}