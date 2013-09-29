# testApp

## Objective



## Usage
node server.js

http://localhost:3000/


## Developing

-- Package Dependency

express 3.4.0
socket.io 0.9.16
mongoose 3.6.20
redis 0.8.5

hiredis 0.1.15
dojo 1.9.1
jade 0.35.0

-- How it works ?

Tier 1 :

FRONT END : Javascript Templates, Stylesheets, CSS, Html

node.js first looks into layout.jade and home.jade

public/lib/app/app.js renders the content of home page

dojo.addOnLoad ...
>> show the stock symbols
>> on click of a symbol..
>> Http Get request  /summary/{symbol}

Tier 2:

BACK END : HTTP Get/Post Request Handler

server.js 

Step 1 :

// Routes
>> app.get("/", function(req, resp) {
>>	resp.render("home", {
>>		pageTitle: "Indian Stock and Mutual Fund Analysis"
>>	});
>>});


Step 2 : when a symbol is clicked

>> app.get("/summary/:symbol", function(req, resp) {
>> - get the symbol from the Reqest
>> - Query the database to get the Summary data
>> - send the data in JSON ()

Step 3 : see the result in the home page



Created with [Nodeclipse v0.4](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   
