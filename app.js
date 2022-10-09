//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://daniel:test1234@cluster0.ctmoznp.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the to-do list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully added default items");
        }
      });
      res.redirect("/"); //that way, the function adds the items, and then runs the code again with the added items, and goes to the else statement
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});


app.get("/:userId", function (req, res) {
  const userId = _.capitalize(req.params.userId);
  List.findOne({name: userId}, function(err, foundList){
 if(!err){
  if(!foundList){
    //create a new list
    const list = new List({
      name: userId,
      items: defaultItems
    });
    list.save();
    res.redirect("/" + userId);
  } else{
    //show existing list
    res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
  }
}
})
}); 



app.post("/", function (req, res) {
const itemName = req.body.newItem;
const listName = req.body.list; //the name of the submit button which has the value of the page title.

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
  item.save(); //the shortcut of mongoose to save items instead of insertMany
  res.redirect("/"); //that is for actually showing the new item on the website in the command in get("/").
  }else{
List.findOne({name: listName}, function(err, foundList){
  foundList.items.push(item);
  foundList.save();
  res.redirect("/" + listName)
})
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function (err) {
    if (err) {
      console.log(err);
    } else{
          console.log("Succeeded to remove item");
          res.redirect("/");
    }
  });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + listName)
      }
    });
    //items is the name of the array, and the checkedItemId is of the checked checkbox that has the value of the id of the object we want to remove
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
  console.log("Server has started successfully.");
});
