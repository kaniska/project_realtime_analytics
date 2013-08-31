dojo.require("dojox.widget.DialogSimple");
dojo.require("dijit.Dialog");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojox.charting.plot2d.Columns");
dojo.require("dojox.charting.DataSeries");
dojo.require("dojox.charting.Chart");
dojo.require("dojox.charting.themes.Tom");
dojo.require("dojox.charting.plot2d.Lines");
dojo.require("dojox.charting.plot2d.Markers");


///
function createContent(tickerdetails) {
	var data = dojo.toJson(tickerdetails);
	console.log("6. Rendering the Summary Data : "+tickerdetails.summary);   
	var content =  "<table border='0' bordercolor='' style='background-color:#CCFFCC' width='500' height='200' cellpadding='5' cellspacing='3'> " +
	 "<tr>" +
	 "<td><p><b>Stock Summary</b> :</p>" +
	 	" <table border='0' style='background-color:#00CC00'  width='200'>" +
	 	" <tr> <td style='color:blue'>Max Price: </td><td>" + tickerdetails.summary.max + "</td> </tr>"+
	 	" <tr> <td style='color:blue'>Min Price: </td><td>" + tickerdetails.summary.min + "</td> </tr>"+
	 	" <tr> <td style='color:blue'>Total Volume: </td><td>" + tickerdetails.summary.volume + "</td> </tr>"+
	 	"</table> </td>" +
	 	"<td><p><b>Stock Details</b> :</p>" +
	 	" <table border='0' width='300'></table> </td>" +	 
	 "</tr>"+
	 "<tr><td colspan='2'><p><b>Stock Trend</b> :</p>" +
	 	" <table border='0' height='100'></table> </td>" +
	 "</tr>"+
	 "</table>";

    return content;
}
var eventDetails = "{}";
//https://dojotoolkit.org/reference-guide/1.8/dojox/charting.html
function showDojoChart() {
	//dojo.byId("chartUI").innerHTML = "<div id='chartNode' style='width:800px;height:400px;'></div>";
	//console.log("Created the Chart Node ...");
	
	var data = dojo.toJson(eventDetails);
	console.log("Received event data ..."+data);
	
	var chartdetails = eventDetails.chartData;
	//console.log("Going to iterate over the chartdata ...."+chartdetails);
	console.log("Chart data length ..."+chartdetails.length);
	var chartData = "[";
	
	for(var i=0; i<chartdetails.length; i++){
		var entry  = chartdetails[i];
		  console.log(entry, "at index", i);
		  var date = new Date(entry.updatedAt);
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
			// will display time in 10:30:23 format
			var formattedTime = hours + ':' + minutes + ':' + seconds;
			 //X axis value			 
			 console.log("Formatted Time : "+formattedTime);
			 // Y -Axis Value
			 console.log("Price  : "+entry.price);
			 chartData = chartData + "{"+"x: "+ formattedTime +", y: "+ entry.price +"}";
			 if(i <chartdetails.length -1) {
				chartData =chartData + ",";
			 }
		}
	chartData = chartData + "]";
	console.log("Temp data ..."+chartData);
	
    // Define the data
   // var chartData2= [10000,9200,11811,12000,7662,13887,14200,12222,12000,10009,11288,12099];
	//var chartData = [{x: 1, y: 10000}, {x: 2, y: 12000}, {x: 3, y: 14000}];
    // Create the chart within it's "holding" node
    console.log("Creating Chart Element ...");
    dojo.byId("chartNode").style.width = "60%";
    //var chart = new Chart("chartNode");
    var chart = new dojox.charting.Chart2D('chartNode');
    
    console.log("Initialized Chart Element...");
    
    // Set the theme
    //chart.setTheme(theme);
    // Add the only/default plot 
    chart.addPlot("default", {
        type: "Lines",
        markers: true
    });
    console.log("Added the plot to the Chart...");
    // Add axes
    //chart.addAxis("time",  {labels:["0", "10","20","30","40","50","60","70","80","90"]});
	
	chart.addAxis("x", {majorLabels: true, minorTicks: false, minorLabels: false, 
	microTicks: false, natural: false, fixed: true,
	majorTick: {color: "red"},
    minorTick: {stroke: "black"}});	
  
    chart.addAxis("y", { min: 5, max: 50, vertical: true});
    // Add the series of data
    chart.addSeries("Stocks Price Time Seriese",chartData);
    console.log("Rendering the Chart...");
    // Render the chart!
    chart.render();
    console.log("Done with the Chart...");
}


function handleSymbolClick(evt) {	
	var symbol = evt.target.attributes["data"].value;
	
	var getTickersummary = (function(){
	    var tickersummary;
	    return function(){
	        if(!tickersummary){
	        	tickersummary = dojo.xhrGet({
	                url: "/summary/" + symbol,
	                handleAs: "json"
	            });
	        }
	        return tickersummary;
	    };
	})();
	 
	dojo.when(getTickersummary(), function(tickersummary){
	    // This callback will be run after the request completes
	 
		console.log("3. Summary Report : "+dojo.toJson(tickersummary)); 
		dojo.byId("reportUI").innerHTML = createContent(tickersummary); 
		// "<table> <tbody> <tr> <td> 'Hello World !' </td> </tr> </tbody> </table>";
		console.log("Show the chart...");
		
		// Show Chart
		//showDojoChart(tickersummary);
		eventDetails = tickersummary;
		dojo.ready(showDojoChart());
		//showGoogleChart();	
	});
	
}

dojo.addOnLoad(function() {
	var socket = new io.Socket();
	socket.connect();
	socket.on("message", function(msg) {
	//	var jade = require('jade');
		var data = dojo.fromJson(msg);
		var html = dojo.byId("ticker-symbols").innerHTML;
		dojo.byId("ticker-symbols").innerHTML = "<div class='ticker-data'>" +
				"<div class='ticker-symbol'><a class='ticker-symb-link' href='#' data='" + data.symbol + "' title='Stock Symbol Analysis'>" + data.symbol + "</a></div>" +
				"<div class='ticker-meta ticker-price'>Price: $" + data.price + "</div>" +
				"<div class='ticker-meta ticker-volume'>Volume: " + data.volume + "</div>" +
			"</div>" + html;

		console.log("pre click-event stage ...");
		
		dojo.query(".ticker-symb-link").onclick(handleSymbolClick);

		console.log("post click-event stage ...");
		
		var nodes = dojo.query("#ticker-symbols .ticker-data")
		var total = 0;
		var d = dojo;
		var lastWidth = 0;

		nodes.forEach(function(node, index, nodes) {
			var style = d.getComputedStyle(node);
			var width = parseInt(style.width.replace(/px/, ""));
			total += width;
			lastWidth = width;
		});
		total += lastWidth;

		var newRight = (lastWidth * -1);
		dojo.style("ticker-symbols", {
			width: (total + (total/2)) + "px", 
			right: newRight + "px"
		});
		dojo.anim("ticker-symbols", {
			right: {
				start: newRight,
				end: 16,
				unit: "px"
			}
		});
		///////////////////////////
	});
	
});

