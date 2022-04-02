// Import express.js
const express = require("express");
// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './app/views');

// Get the functions in the db.js file to use
const db = require('./services/db');

// Add the luxon date formatting library
const { DateTime } = require("luxon");

// Get the models
const { Student } = require("./models/student");
const programmes = require("./models/programmes");
const { User } = require("./models/user");

// Set the sessions
var session = require('express-session');
app.use(session({
    secret: 'secretkeysdfjsflyoifasd',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Create a route for root - /

app.get("/", function(req, res) {
    console.log(req.session);
    if (req.session.uid) {
   res.send('Welcome back, ' + req.session.uid + '!');
   } else {
   res.send('Please login to view this page!');
   }
   res.end();
   });

// Create route for the calendar

// Here we have a page which demonstrates how to both input dates and display dates
app.get("/calendar", async function (req, res) {
    // Get all the dates from the db to display
    // NB Move this to a model that is appropriate to your project
    sql = "SELECT * from dates";
    // We could format dates either in the template or in the backend
    dates = [];
    results = await db.query(sql);
    // Loop through the results from the database
    for (var row of results) {
        // For some reason the dates are fomatted as jsDates. I think thats the Mysql2 library at work!
        dt = DateTime.fromJSDate(row['date']);
        // Format the date and push it to the row ready for the template
        // NB Formatting could also be done in the template
        // NB date formats are usually set up to work throughout your app, you would not usually set this in every row.
        // you could put this in your model.
        dates.push(dt.toLocaleString(DateTime.DATE_HUGE));
    }
    // Render the calendar template, injecting the dates array as a variable.
    res.render('calendar', { dates: dates });
});

// Task single student page

app.get("/single-student/:id", async function (req, res) {
    var stId = req.params.id;
    // Create a student class with the ID passed
    var student = new Student(stId);
    await student.getStudentDetails();
    await student.getStudentProgramme();
    await student.getStudentModules();
    resultProgs = await programmes.getAllProgrammes();
    console.log(student);
    res.render('student', { 'student': student, 'programmes': resultProgs });
});

// Register
app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/set-password', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            // If a valid, existing user is found, set the password and redirect to the users single-student page
            await user.setUserPassword(params.password);
            res.redirect('/single-student/' + uId);
        }
        else {
            // If no existing user is found, add a new one
            newId = await user.addUser(params.email);
            res.send('Perhaps a page where a new user sets a programme would be good here');
        }
    } catch (err) {
        console.error(`Error while adding password `, err.message);
    }
});

// Login
app.get('/login', function (req, res) {
    res.render('login');
});

// Check submitted email and password pair

app.post('/authenticate', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            match = await user.authenticate(params.password);
            if (match) {
                // Set the session for this user 
                req.session.uid = uId;
                req.session.loggedIn = true;
                console.log(req.session);
                res.redirect('/single-student/' + uId);
            }
            else {
                // TODO improve the user journey here
                res.send('invalid password');
            }
        }
        else {
            res.send('invalid email');
        }
    } catch (err) {
        console.error(`Error while comparing `, err.message);
    }
});

// Logout

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
    });
app.post('/add-note', function (req, res) {
    // Get the submitted values
    params = req.body; // request body 
    // Note that we need the id to get update the correct student
    var student = new Student(params.id)  // A new student object and pass the id to the constructor 
    // Adding a try/catch block which will be useful later when we add to the database
    try { // Call our new method 
        student.addStudentNote(params.note).then(result => {
            res.redirect('/single-student/' + params.id); // Going back to the single student path and pull the id from the post parameter 
        })
    } catch (err) {
        console.error(`Error while adding note `, err.message);
    }
});

// Create a post route to handle the form submission of the option list

app.post('/student-select', function (req, res) {
    // Retrieve the parameter and redirect to the single student page
    id = req.body.studentParam;
    res.redirect('/single-student/' + id);
});

// A post route to recieve new data for a students' programme

app.post('/allocate-programme', function (req, res) {
    params = req.body;
    var student = new Student(params.id)
    // Adding a try/catch block which will be useful later when we add to the
    database
    try {
        student.updateStudentProgramme(params.programme).then(result => {
            res.redirect('/single-student/' + params.id);
        })
    } catch (err) {
        console.error(`Error while adding programme `, err.message);
    }
});

// Capture the date input and save to the db

app.post('/set-date', async function (req, res) {
    params = req.body.date;
    console.log(params);
    //construct a date object from the submitted value - use a library
    var inputDate = DateTime.fromFormat(params, 'yyyy-M-dd');
    console.log(inputDate);
    // Add the date: NB this should be in a model somewhere
    sql = "INSERT into dates (date) VALUES (?)";
    try {
        await db.query(sql, [inputDate.toSQLDate()]);
    } catch (err) {
        console.error(`Error while adding date `, err.message);
        res.send('sorry there was an error');
    }
    res.send('date added');
});

// Check submitted email and password pair

app.post('/authenticate', async function (req, res) {
    params = req.body;
    var user = new User(params.email);
    try {
        uId = await user.getIdFromEmail();
        if (uId) {
            match = await user.authenticate(params.password);
            if (match) {
                res.redirect('/single-student/' + uId);
            }
            else {
                // TODO improve the user journey here
                res.send('invalid password');
            }
        }
        else {
            res.send('invalid email');
        }
    } catch (err) {
        console.error(`Error while comparing `, err.message);
    }
});

// Create a route for testing the db

app.get("/db_test", function (req, res) {
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
// Task  JSON formatted listing of students 
app.get("/all-students", function (req, res) {
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

// Task  display a formatted list 
app.get("/all-students-formatted", function (req, res) {

    var sql = 'select * from Students';
    // Use the db.query() function from services/db.js to send our query
    // We need the result to proceed, but
    // we are not inside an async function we cannot use await keyword here.
    // So we use a .then() block to ensure that we wait until the
    // promise returned by the async function is resolved before we proceed
    db.query(sql).then(results => {
        res.render('all-students', { data: results });
    });
});
// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function (req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function (req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});