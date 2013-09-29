var sys      = require("sys");
var util     = require("util");
// Use locally-installed modules
require.paths.unshift('./node_modules');
// Cloud Foundry
var cf       = require("cloudfoundry");
// MongoDB
var mongoose = require("mongoose"),
    Schema   = mongoose.Schema;
// Redis
var redis    = require("redis");
// Express
var express  = require("express");
var app      = express.createServer();
// Configure the app
app.configure(function() {
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(app.router);	
	app.use(express.static(__dirname + '/public'));
	
	app.set('view engine', 'jade');
	app.set('running in cloud', cf.isRunningInCloud());

	if(!cf.isRunningInCloud()) {
		// Only use this in public for samples or development
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	}
});
// Socket.IO (sort of :)
var io       = require("socket.io").listen(app, {
	transports: ['xhr-polling'], 
	transportOptions: {
		'xhr-polling': {duration: 10000}
	} 
});

// Mongoose Models --> 
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

var mongoConfig = cf.getServiceConfig("mongo-connector");
var db = mongoose.createConnection("mongodb://" + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.hostname + ":" + mongoConfig.port + "/" + mongoConfig.db);
var mongooseTypes = require("mongoose-types")
, useTimestamps = mongooseTypes.useTimestamps;
StocksEventSchema.plugin(useTimestamps);

// util.debug("mongo connection: "+"mongodb://" + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.hostname + ":" + mongoConfig.port + "/" + mongoConfig.db);
// Connect to Redis
var redisConfig = cf.getServiceConfig("redis-connector");
// util.debug("redis config: "+JSON.stringify(redisConfig));
var redisClient = redis.createClient(redisConfig.port, redisConfig.hostname);
var redisPublisher = redis.createClient(redisConfig.port, redisConfig.hostname);
if(redisConfig.password) {
	redisClient.auth(redisConfig.password);
	redisPublisher.auth(redisConfig.password);
}
var watchers = {};
redisClient.subscribe("redis-connector");
redisClient.on("message", function(channel, json) {
	
	util.debug("<================ START ===============>");
	
	var data = JSON.parse(json);
	var Summary = db.model('StocksSummarySchema2','stockssummaryinfo');
	var TickerEvent = db.model('StocksEventSchema2', 'stocksdata');
	var te = new TickerEvent({
		symbol: data.symbol,
		price: data.price,
		volume: data.volume
	});
	TickerEvent.count({}, function( err, count){   
    	// util.debug( "Records Count:", count ); 

    if(count < STOCKS_INFO.length) {
		te.save(function(err) {
			if(err) {
				throw(err);
			}
			util.debug("Step 1 : Got a Stock Symbol.."+JSON.stringify(data));
			util.debug(te.createdAt); // Should be approximately now
			var v_max = 0;
			var v_min = 0;

			
			////////////// Step 1 - calculate Max
			TickerEvent.find({ symbol : data.symbol }).sort('price', -1).limit(1).run( function(err, doc1) {			
			if(doc1) {
							util.debug(" Got Document1 "+doc1[0]+" for symbol "+data.symbol);
							 v_max = doc1[0].price;
							 util.debug(" Got Max Val : "+v_max);
							 
							 /////////// Step 3 - calculate Min
							 TickerEvent.find({ symbol : data.symbol }).sort('price', 1).limit(1).run( function(err, doc2) {
								 if(doc2) {
										util.debug(" Got Document2 "+doc2[0]+" for symbol "+data.symbol);
										 v_min = doc2[0].price;
										 util.debug("Got Min Val : "+v_min);
										 
									//////// Step 4 - calculate Summary
										 
										 Summary.find({ symbol : data.symbol }).limit(1).run(function (err, doc3){
											if(!err) {
												util.debug("Found Summary " + doc3[0]);
											 }
											 else {
												util.debug("Error: could not find Summary for " + data.symbol);
											 }
											if(!doc3 || doc3.length == 0) {
												util.debug("Event : Create new Summary document ");
												var summaryDoc = new Summary();
												summaryDoc.symbol = data.symbol;		
												  summaryDoc.timestamp = 1234;
												  summaryDoc.max = v_max;
												  summaryDoc.min = v_min;
												  summaryDoc.volume = data.volume;
												  summaryDoc.save(function(err) {
														if(err) {
															throw(err);
														}
												  });							 			
			
											}else {
												  doc3[0].symbol = data.symbol;		
												  doc3[0].timestamp = 1234;
												  doc3[0].max = v_max;
												  doc3[0].min = v_min;
												  doc3[0].volume = doc3[0].volume + data.volume;
												  doc3[0].save();
												  
												  util.debug("Step 4 : Saved the summary.."+JSON.stringify(doc3[0]));
												  }
											  util.debug("<================ END ===============>");
											});
										 
								 }
							});
				
				}
				 
			});	
			
		});
	 }
  });	 

 io.broadcast(json);
});

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

var stocksEventSender;
var index = 0;
function sendStocksEvents() {
	var symbolInfo = {
		symbol: getSymbol(index), 
		price: getPrice(index),
		volume: getVolume(index)
	};
	//util.debug("sending ticker event: " + JSON.stringify(symbolInfo));
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
		//util.debug("Got an event");
		stocksEventSender = setTimeout(sendStocksEvents, timeout);	
	//}else {
	//    stocksEventSender = null;
	//}
}

// Routes
app.get("/", function(req, resp) {
	resp.render("home", {
		pageTitle: "Indian Stocks Analysis"
	});
});

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
				StocksEvent2.find({ symbol : req.params.symbol }).limit(30).run(function (err, chartdata){
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
// Fetch Stocks Stream
		io.on("connection", function(client) {
			if(!stocksEventSender) {
				sendStocksEvents();
			}
			util.debug("connection made..." + client);
		});	
// Listen for requests
app.listen(cf.getAppPort());

