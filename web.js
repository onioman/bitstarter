var express = require('express');
var app = express.createServer(express.logger());

var fs = require('fs');
var indexContent = fs.readFileSync('index.html', 'utf8');

var getIndexContent = function(index) {
	return fs.readFileSync(index, 'utf8');
};

app.get('/', function(request, response) {
	//response.send(indexContent.toString("utf-8"));
	response.send(getIndexContent('index.html').toString("utf-8"));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
