// Import express.js
const express = require("express");
// Create express app
var app = express();
// Add static files location
app.use(express.static("static"));
app.set('view engine', 'pug');
app.set('views', './app/views');
// Get the functions in the db.js file to use
const db = require('./services/db');
// Get the models
const { Student } = require("./models/student");
// Create a route for root - /
app.get("/", function(req, res) {
    // Set up an array of data 
    var test_data = ['one', 'two', 'three', 'four'];
    // Send the array through to the template as a variable call 
    res.render("index", {'title': 'My index page',
     'heading':'My heading', 'data':test_data});
});

// Task 1 JSON formatted listing of students 
app.get("/all-students", function(req, res){
    
    var sql = 'select * from Students';
    // Use the db.query() function from services/db.js to send our query
    // We need the result to proceed, but
    // we are not inside an async function we cannot use await keyword here.
    // So we use a .then() block to ensure that we wait until the
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    });
});
// Task 2 display a formatted list 
app.get("/all-students-formatted", function(req, res){
    
    var sql = 'select * from Students';
    // Use the db.query() function from services/db.js to send our query
    // We need the result to proceed, but
    // we are not inside an async function we cannot use await keyword here.
    // So we use a .then() block to ensure that we wait until the
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        res.render('all-students', {data:results});
    });
});
   // Task 3 Single student page 
   app.get("/single-student/:id", async function (req, res) {
    var stId = req.params.id;
    // Create a student class with the ID passed
    var student = new Student(stId);
    await student.getStudentName();
    await student.getStudentProgramme();
    await student.getStudentModules();
    console.log(student);
    res.render('student', {student:student});
   });
// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Prepare an SQL query that will return all rows from the test_table
    var sql = 'select * from test_table';
    
    // Use the db.query() function from services/db.js to send our query
    // We need the result to proceed, but
    // we are not inside an async function we cannot use await keyword here.
    // So we use a .then() block to ensure that we wait until the
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
    
    // Take a peek in the console
        console.log(results);
    
    // Send to the web pate
        res.json(results)
    });
   });

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});