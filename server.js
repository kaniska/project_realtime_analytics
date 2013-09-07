
/**
 * Module dependencies.
 */
var express = require('/usr/lib/node_modules/express');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');
var sys      = require("sys");
var util     = require("util");
var fs     = require("fs");
var config = JSON.parse(fs.readFileSync("./service-defaults.json","utf8"));
//MongoDB
var mongoose = require("/usr/lib/node_modules/mongoose"),
    Schema   = mongoose.Schema;
// Redis
var redis    = require("/usr/lib/node_modules/redis");
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

////////////////////////

//Mongoose Models --> 
var safe_params = { j: 1, w: 1, wtimeout: 10000 };

var StocksEventSchema = new Schema({
	symbol: { type: String },
	 price: { type: Number },
	volume: { type: Number }
},{safe:safe_params});
mongoose.model('StocksEventSchema2', StocksEventSchema);


var StocksSummarySchema = new Schema({
	   symbol: { type: String },
	timestamp: { type: Number },
	      max: { type: Number },
	      min: { type: Number },
	  average: { type: Number },
	   volume: { type: Number }
},{safe:safe_params});
mongoose.model('StocksSummarySchema2', StocksSummarySchema);

///////////////////////////////////////////////////

var mongoConfig = config.mongo;
var db = mongoose.createConnection("mongodb://" + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.hostname + ":" + mongoConfig.port + "/" + mongoConfig.db);
var mongooseTypes = require("mongoose-types")
, useTimestamps = mongooseTypes.useTimestamps;
StocksEventSchema.plugin(useTimestamps);

// util.debug("mongo connection: "+"mongodb://" + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.hostname + ":" + mongoConfig.port + "/" + mongoConfig.db);
///////////////////////
var redisConfig = config.redis;
//util.debug("redis config: "+JSON.stringify(redisConfig));
var redisClient = redis.createClient(redisConfig.port, redisConfig.hostname);
var redisPublisher = redis.createClient(redisConfig.port, redisConfig.hostname);
if(redisConfig.password) {
	redisClient.auth(redisConfig.password);
	redisPublisher.auth(redisConfig.password);
}

/////////////////////////////
var watchers = {};
redisClient.subscribe("redis-connector");
redisClient.on("message", function(channel, json) {
	
	util.debug("<================ START ===============>");
	util.debug("Incoming data ... " + json );
	
	var data = JSON.parse(json);
	
	util.debug("Parsed data ... " + data );
	
	var TickerEvent = db.model('StocksEventSchema2', 'stocksdata');
	
	//////////////////
	
	TickerEvent.count({}, function( err, count){   
		util.debug( "Records Count:", count ); 

		if(count < STOCKS_INFO.length) {
			var te = new TickerEvent({
				symbol: data.symbol,
				price: data.price,
				volume: data.volume
			});
			
			te.save(function(err) {
				if(err) {
					throw(err);
				}
				util.debug("Step 1 : Got a Stock Symbol.."+JSON.stringify(data));
				util.debug(te.createdAt); // Should be approximately now
				var v_max = 0;
				var v_min = 0;			
			});

		}
	});
	util.debug( "Abbout to send data to Browser.."); 
	io.sockets.send(json);
	util.debug( "Sent data to Browser:", json ); 
});

//////////////////////////////////////////////
var STOCKS_INFO = [
                   ["RIL",20,100],
             	  ["RIL",10,100],
             	  ["RIL",40,100],
                   ["TCS",10,100],
                   ["TCS",30,100],
                   ["INFY",10,100],
                   ["INFY",8,100],
                   ["INFY",28,100],
                   ["RIL",20,100],
             	  ["RIL",10,100],
             	  ["RIL",40,100],
                   ["TCS",10,100],
                   ["TCS",30,100],
                   ["INFY",10,100],
                   ["INFY",8,100],
                   ["INFY",28,100],
             	  ["RIL7",20,100],
             	  ["RIL7",10,100],
             	  ["RIL7",40,100],
                   ["TCS7",10,100],
                   ["TCS7",30,100],
                   ["INFY7",10,100],
                   ["INFY7",8,100],
                   ["INFY7",28,100],
             	  ["WIPRO1",30,100],
             	  ["WIPRO1",40,100],
             	  ["WIPRO1",60,100]
             	  ];

             function getSymbol(index) {
             	if(typeof STOCKS_INFO[index] == 'undefined') {
             		return undefined;
             	}
             	
             	return STOCKS_INFO[index][0];
             }

             function getPrice(index) {
             	if(typeof STOCKS_INFO[index] == 'undefined') {
             		return undefined;
             	}
             	return STOCKS_INFO[index][1];
             }

             function getVolume(index) {
             	if(typeof STOCKS_INFO[index] == 'undefined') {
             		return undefined;
             	}
             	return STOCKS_INFO[index][2];
             }

///////////////////////////////////////////

             var stocksEventSender;
             var index = 0;
             
             function sendStocksEvents() {
             	var symbolInfo = {
             		symbol: getSymbol(index), 
             		price: getPrice(index),
             		volume: getVolume(index)
             	};
             	util.debug("sending ticker event: " + JSON.stringify(symbolInfo));
             	if(typeof symbolInfo.symbol != 'undefined') {
             		redisPublisher.publish("redis-connector", JSON.stringify(symbolInfo));
             	}
             	
             	var timeout = Math.round(Math.random() * 12000);
             	if(timeout < 3000) {
             		timeout += 10000;
             	}
             	index++;
             	if(index == STOCKS_INFO.length) {		
             	 index = 0;
             	}
             		util.debug("Got an event");
             		stocksEventSender = setTimeout(sendStocksEvents, timeout);	
             	//}else {
             	//    stocksEventSender = null;
             	//}
             }
             
             
/////////////////////////////////
             app.get("/", function(req, resp) {
            		resp.render("home", {
            			pageTitle: "Stock Market Analytics"
            		});
            	});
//app.get('/users', user.list);

/////////////////////////////////////

app.get("/summary/:symbol", function(req, resp) {
	/*mongoose.connection.on("open", function(){
	util.debug("mongodb is connected!!");
	});*/	
util.debug("<<======  SUMMARY  ======>>");	
util.debug("found symbol ..." + req.params.symbol);

var StocksSummary2 = db.model('StocksSummarySchema2','stockssummaryinfo');
util.debug("Found TickerSummary");
var StocksEvent2 = db.model('StocksEventSchema2', 'stocksdata');
util.debug("Found TickerEvent");
StocksSummary2.findOne({ "symbol" : req.params.symbol}, function(err, summarydata) {		
	if(err) {
		throw(err);
	}else{
		util.debug("Good data >> "+summarydata);
	}
	if(!summarydata) {
	    util.debug("Data undefined " + summarydata);
	}else {		
		util.debug("Found it!! "+summarydata);
		var summaryDataJson = JSON.stringify(summarydata);
		util.debug("Event 3 : Got the Summary "+ summaryDataJson);
		StocksEvent2.find({ "symbol" : req.params.symbol }, 
				function (err, chartdata){
				if(err) {
					throw(err);
				}
				var chartDataJson = JSON.stringify(chartdata);
				
				util.debug("Complete data set ..."+ JSON.stringify({summary: summaryDataJson, chartdata: chartDataJson}));
							
				resp.send(JSON.stringify({summary: summarydata, chartData: chartdata}));
		//resp.send(summaryDataJson);
		});	
    }			
});	
});

/////////////////////////////////

var httpServer = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io  = require("socket.io").listen(httpServer);

io.sockets.on('connection', function (socket) {
	if(!stocksEventSender) {
		sendStocksEvents();
	}
    util.debug("connection made..." + httpServer);
});


httpServer.listen(app.get('port'));