/**
 * Web interface dependencies 
 */

var wpcom = require('wpcom'),
	jsonMarkup = require('json-markup'),
	express = require('express'),
	logger = require('morgan'),
	errorhandler = require('errorhandler'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	queryString = require('query-string'),
	request = require('request'),
	crypto = require('crypto');

/** 
 * PiTFT dependencies 
 */
var pitft = require("pitft"),
	fb = pitft("/dev/fb1");

// Clear the screen buffer
fb.clear();

var xMax = fb.size().width;
var yMax = fb.size().height;

// Simple debug function
function printRandomPi() {
	var x = Math.random() * (xMax + 32) - 16;
    var y = Math.random() * (yMax + 32) - 16;

    fb.image(x, y, "raspberry-pi-icon.png");
}

var app = express();

//TODO: app.configure('development', () -> ...
var session_secret = "FixMePlease"; //TODO: session secret, unique to your application
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(errorhandler({ dumpExceptions: true, showStack: true }));
app.use(cookieParser());
app.use(session({secret: session_secret, resave: false, saveUninitialized: true}));

var hostname = 'pi2.dev';

var wpcc_consts = {
	"client_id": 44430, 
	"client_secret": "RZhIjohkmtxQ6PKxQqZCPbueUjJ4GwX5miQn0aMZ7rheGBLdXf74e7d9ByLlP960", 
	"login_url": "http://"+hostname+":3000/", 
	"redirect_url": "http://"+hostname+":3000/connected", 
	"request_token_url": "https://public-api.wordpress.com/oauth2/token",
	"authenticate_url": "https://public-api.wordpress.com/oauth2/authenticate"
}

// static routes
app.use('/stylesheets/', express.static(__dirname + '/../css'));
app.use('/img/', express.static(__dirname + '/img'));

app.get('/', function(req, res) {
	var state = crypto.createHash('md5').digest("hex");
	req.session.wpcc_state = state;
	
	var params = { 
		"response_type": "code", 
		"client_id": wpcc_consts.client_id, 
		"state": state,
		"redirect_uri": wpcc_consts.redirect_url
	};

	var wpcc_url = wpcc_consts.authenticate_url + '?' + queryString.stringify(params);

	res.render('index', { title: 'PiBlog', wpcc_url: wpcc_url});
});

app.get('/account', function(req, res) {
	res.render('account', { title: 'PiBlog - Account' });
});

app.get('/connected', function(req, res) {
	
	if ( req.query.code ) {
		if ( ! req.query.state ) {
			res.end( 'Warning! State variable missing after authentication' );
			return;
		}
		if ( req.query.state != req.session.wpcc_state ) {
			res.end( 'Warning! State mismatch. Authentication attempt may have been compromised.' )
			return;
		}

		var post_data = { "form" : {
			"client_id" : wpcc_consts.client_id,
			"redirect_uri" : wpcc_consts.redirect_url,
			"client_secret" : wpcc_consts.client_secret,
			"code" : req.query.code, // The code from the previous request
			"grant_type" : 'authorization_code'
		} };

		request.post(
			wpcc_consts.request_token_url,
			post_data,
			function _callback(error, response, body) {
				if (!error && response.statusCode == 200) {
					//TODO: in real app, store the returned token
					var access_token = JSON.parse(body).access_token;
					
					printRandomPi();

					wpcom(access_token)
						.me()
						.get(function(err, data) {
							res.redirect('/account');
						});
				} else {
					res.render('account', { title: 'PiBlog', message: 'ERROR: ' + body});
				}
			}
		);
	} else {
		//redirect errors or cancelled requests back to login page
		res.writeHead( 303, {
			'Location': wpcc_consts.login_url
		});
		res.end();
	}

});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('PiBlog listening at http://%s:%s', host, port);
});


// fb.image(x, y, "raspberry-pi.png"); // Draw the image from the file "raspberry-pi.png" at position x, y

// for (var n=0; n<1000; n++) {
    
// }
