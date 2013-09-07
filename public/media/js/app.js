dojo.require("dojox.widget.DialogSimple");
dojo.require("dijit.Dialog");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.DataChart");
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojox.charting.plot2d.Columns");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.plot2d.Areas");
dojo.require("dojox.charting.plot2d.Default");
dojo.require("dojox.charting.DataSeries");
dojo.require("dojox.charting.Chart");
dojo.require("dojox.charting.themes.Tom");
dojo.require("dojox.charting.plot2d.Lines");
dojo.require("dojox.charting.plot2d.Markers");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require('dojox.charting.StoreSeries');
dojo.require('dojox.charting.action2d.Tooltip');
dojo.require("dojo.fx");

var eventDetails = "{}";
var chart = null;
var summaryContent = null;
// http://www.sitepen.com/blog/2009/03/30/introducing-dojox-datachart/
// http://www.sitepen.com/blog/2010/07/13/dive-into-dojo-charting/
function createContent(stockdetails) {
	// var data = dojo.toJson(stockdetails);
	// console.log("6. Rendering the Summary Data : "+stockdetails.summary);

	summaryContent = "<b> <font color='brown'>Summary :</font></b>&nbsp;&nbsp;&nbsp;&nbsp; <b> Symbol : </b><font color='blue'>"
			+ stockdetails.summary.symbol
			+ "</font>&nbsp;&nbsp;&nbsp;&nbsp;<b> Max : <font color='blue'>"
			+ stockdetails.summary.max
			+ "</font>&nbsp;&nbsp;&nbsp;&nbsp;<b> Min : </b><font color='blue'>"
			+ stockdetails.summary.min
			+ "</font>&nbsp;&nbsp;&nbsp;&nbsp;<b> Total Volume : </b><font color='blue'>"
			+ stockdetails.summary.volume + "</font>";

	return summaryContent;
}

var yAxisLabelFunc = function(text, value, precision) {
	return "Rs. " + text;
};

// https://dojotoolkit.org/reference-guide/1.8/dojox/charting.html
function showDojoChart() {
	// dojo.byId("chartUI").innerHTML = "<div id='chartNode'
	// style='width:800px;height:400px;'></div>";
	// console.log("Created the Chart Node ...");

	var data = dojo.toJson(eventDetails);
	console.log("Received event data ..." + data);

	var chartdetails = eventDetails.chartData;
	// console.log("Going to iterate over the chartdata ...."+chartdetails);
	console.log("Chart data length ..." + chartdetails.length);
	// ,\"idAttribute\":\"entryindex\"
	var chartData = "{\"identifier\":\"entryindex\",\"label\":\"Price\",\"items\":[";
	var chartData2 = [];
	//
	for ( var i = 0; i < chartdetails.length; i++) {
		var entry = chartdetails[i];
		console.log(entry, "at index", i);
		var date = new Date(entry.updatedAt);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		// will display time in 10:30:23 format
		var formattedTime = hours + ':' + minutes + ':' + seconds;
		// X axis value
		console.log("Formatted Time : " + formattedTime);
		// Y -Axis Value
		console.log("Price  : " + entry.price);
		chartData = chartData + "{" + "\"entryindex\": " + i + ", \"price\": "
				+ entry.price + "}";
		chartData2[i] = entry.price;

		if (i < chartdetails.length - 1) {
			chartData = chartData + ", ";
			// chartData2 = chartData2+ ",";
		}
	}
	chartData = chartData + "]}";

	// chartData2 = chartData2 + "]";
	console.log("chart Data 1 ..." + chartData);
	console.log("chart Data 2 ..." + chartData2);

	var mystore = new dojo.data.ItemFileWriteStore({
		data : chartData
	});

	// Define the data
	// var chartData1= [10,20,30,40,50];
	// var chartData3 = [{x: 0, y: 20}, {x: 1, y: 10}, {x: 2, y: 40}, {x: 3, y:
	// 20}, {x: 4, y: 10}, {x: 5, y: 40}, {x: 6, y: 20}, {x: 7, y: 10}, {x: 8,
	// y: 40}, {x: 9, y: 20}];

	// Create the chart within it's "holding" node
	console.log("Creating Chart Element ...");
	dojo.byId("chartNode").style.width = "60%";
	// var chart = new Chart("chartNode");

	console.log("Initialized Chart Element...");

	if (!chart) {
		chart = new dojox.charting.Chart("chartNode", {
			title : "Price Variation(Stocks/Mutual Fund)",
			titlePos : "top",
			titleGap : 25,
			titleFont : "normal normal normal 15pt Arial",
			titleFontColor : "orange"
		});

		// Set the theme
		// chart.setTheme(theme);
		// Add the only/default plot
		chart.addPlot("default", {
			type : "Areas",
			markers : true
		});
		console.log("Added the plot ...");
		// Add axes
		chart.addAxis("x");
		// chart.addAxis("x", {min: 0, max: 10, majorLabels: true, minorTicks:
		// false, minorLabels: false,
		// microTicks: false, natural: false, fixed: true,
		// majorTick: {color: "red"},
		// minorTick: {stroke: "black"}});
		chart.addAxis("y", {
			min : 5,
			max : 50,
			vertical : true,
			labelFunc : yAxisLabelFunc
		});
		// Add the series of data
		// chart.addSeries("y", new DataSeries(mystore, {query: {price: "*"}},
		// "price"),{stroke: 'red', fill: 'pink'});
		chart.addSeries("Stock Price ", chartData2);
		// chart.setStore(mystore, {entryindex:"*"}, "price");
		console.log("Rendering the Chart...");
	} else {
		chart.updateSeries("Stock Price ", chartData2);
	}
	// tooltips!
	new dojox.charting.action2d.Tooltip(chart, "default");
	// Render the chart!
	chart.render();
	console.log("Done with the Chart...");
}

function handleSymbolClick(evt) {
	var symbol = evt.target.attributes["data"].value;

	var getTickersummary = (function() {
		var tickersummary;
		return function() {
			if (!tickersummary) {
				tickersummary = dojo.xhrGet({
					url : "/summary/" + symbol,
					handleAs : "json"
				});
			}
			return tickersummary;
		};
	})();

	dojo.when(getTickersummary(), function(tickersummary) {
		// This callback will be run after the request completes

		console.log("3. Summary Report : " + dojo.toJson(tickersummary));
		dojo.byId("reportUI").innerHTML = createContent(tickersummary);
		// "<table> <tbody> <tr> <td> 'Hello World !' </td> </tr> </tbody>
		// </table>";
		console.log("Show the chart...");

		// Show Chart
		// showDojoChart(tickersummary);
		eventDetails = tickersummary;
		dojo.ready(showDojoChart());
		// showGoogleChart();
	});

}

dojo.addOnLoad(function() {
			var socket = io.connect('http://localhost');
			socket.on("message",
							function(msg) {
								console.log("Got msg ... " + msg);

								// var jade = require('jade');
								var data = dojo.fromJson(msg);
							/*	var tickerSymbolNode = dojo.byId("stocks-symbols");
								if (tickerSymbolNode == null) {
									tickerSymbolNode = dojo.create("stocks-symbols");
								}*/
								var html = dojo.byId("stocks-symbols").innerHTML;
								dojo.byId("stocks-symbols").innerHTML = "<div class='stocks-data'>" +"<div class='stocks-symbol'><a class='stocks-symb-link' href='#' data='" + data.symbol + "' title='Stock Symbol Analysis'>" + data.symbol + "</a></div>" +
									"<div class='stocks-meta stocks-price'>Price: $" + data.price + "</div>" +
									"<div class='stocks-meta stocks-volume'>Volume: " + data.volume + "</div>" +
								"</div>" + html;

								console.log("pre click-event stage ...");

								dojo.query(".stocks-symb-link").onclick(handleSymbolClick);

								console.log("post click-event stage ...");

								var nodes = dojo.query("#stocks-symbols .stocks-data")
								var total = 0;
								var d = dojo;
								var lastWidth = 0;

								nodes.forEach(function(node, index, nodes) {
									var style = d.getComputedStyle(node);
									var width = parseInt(style.width.replace(
											/px/, ""));
									total += width;
									lastWidth = width;
								});
								total += lastWidth;

								var newRight = (lastWidth * -1);
								dojo.style("stocks-symbols", {width : (total + (total / 2)) + "px",right : newRight + "px"});
								
								dojo.anim("stocks-symbols", {right : {start : newRight,end : 16,unit : "px"}});
								
								/*dojo.fx.chain([
								                dojo.fadeIn({ node: slideTarget }),
								                dojo.fx.slideTo({ node: slideTarget, left: "0", top: "100" }),
								                dojo.fadeOut({ node: slideTarget })
								            ]).play();*/
								
								///////////////////////////
							});

		});


