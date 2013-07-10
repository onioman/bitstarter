#!/usr/bin/env node
/*
utomatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

+ cheerio
- https://github.com/MatthewMueller/cheerio
- http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
- http://maxogden.com/scraping-with-node.html

+ commander.js
- https://github.com/visionmedia/commander.js
- http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

+ JSON
- http://en.wikipedia.org/wiki/JSON
- https://developer.mozilla.org/en-US/docs/JSON
- https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLURL_DEFAULT = "";

var assertFileExists = function(infile) {
	var instr = infile.toString();
	if(!fs.existsSync(instr)) {
		console.log("%s does not exist. Exiting.", instr);
		process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
	}
	return instr;
};

var cheerioHtmlFile = function(html) {
	return cheerio.load(html);
};

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkNode = function(node, html, out) {
	// check whether the class is present and in the right place
	out[node["class"]] = html.length > 0;
	// check the children of this node
	for(var ii in node["children"]) {
		var child = node["children"][ii];
		checkNode(child, html.children(child["class"]), out);
	}	
}

var checkHtml = function(html, checksfile) {
	$ = cheerioHtmlFile(html);
	var checks = loadChecks(checksfile);
	var out = {};
	for(var ii in checks) {
		var root = checks[ii];
		checkNode(root, $(root["class"]), out);
	}
	return out;
};

var clone = function(fn) {
	// Workaround for commander.js issue.
	// http://stackoverflow.com/a/6772648
	return fn.bind({});
};

var buildResponseHandler = function(url, checks) {
	var handleResponse = function(result, response) {
		if (result instanceof Error) {
			console.error("Couldn't fetch url %s because %s . Exiting.", 
							url, response);
			process.exit(1); 
		} else {
			doTheChecks(result, checks);
		}
	};
	return handleResponse;
}

var doTheChecks = function(html, checks) {
	var checkJson = checkHtml(html, checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
}

if(require.main == module) {
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <html_url>', 'Url to index.html', HTMLURL_DEFAULT)
		.parse(process.argv);

	// get the html
	var html = ""
	if (program.url == HTMLURL_DEFAULT) {
		html = fs.readFileSync(program.file)
		doTheChecks(html, program.checks);
	} else {
    	rest.get(program.url).on('complete', 
						buildResponseHandler(program.url, program.checks));
	}
	
} else {
	exports.checkHtml = checkHtml;
}
