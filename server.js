// set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var https = require('https');
var validateInteger = require('mongoose-integer');

// configuration =================

mongoose.connect('mongodb://localhost/myapp');     // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// define model =================

var Schema = mongoose.Schema;

var GamesSchema = new Schema({
    _id: {  type: Number,
            integer: true
        },
    lane: String,
    champion: String,
    role: String,
    timestamp: Date
});
GamesSchema.plugin(validateInteger);


var SummonerSchema = new Schema({
    _id: Number,
    name : String, 
    profileIconId : Number,
    summonerLevel : Number,
    'games':[GamesSchema]
});

var Summoner = mongoose.model('Summoner', SummonerSchema);  

// routes ======================================================================

    // api ---------------------------------------------------------------------
    
    app.get('/api/summoners', function (req, res){

         Summoner.find(function(err, summoners) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(summoners); // return all summoners in JSON format
        });

    });

    // get a summer name by id
    app.get('/api/summoner/:summoner_id', function(req, res) {

        
        var summonerid = req.params.summoner_id;

        Summoner.findById(summonerid, function(err, summonerdata){

            if (err) return handleError(err)

            if(summonerdata != null) {

                console.log("Found profile id ("+summonerdata._id+') in mongodb');
                res.json(summonerdata);

            } else {
                //
                var options = {

                hostname: 'euw.api.riotgames.com',
                port: 443,
                path: '/api/lol/EUW/v1.4/summoner/' + summonerid + '?api_key=07b3b5ea-9c79-4856-bbc5-cd50a2aad139',
                method: 'GET'

                }           

                var req = https.request(options, (res) => {
                    //console.log('statusCode:', res.statusCode);
                    //console.log('headers:', res.headers);
                    var summoner_data_string = "";

                    res.on('data', function(data, res) {
                        
                        summoner_data_string += data;
                        console.log('in res.on data');
                    });

                    res.on('end', function(){
                        console.log('in res.on end');
                        var SummonerDto = JSON.parse(summoner_data_string);
                        
                        for (var key in SummonerDto){
                            Summoner.create({
                                _id : SummonerDto[key].id,
                                name : SummonerDto[key].name,
                                profileIconId : SummonerDto[key].profileIconId,
                                summonerLevel : SummonerDto[key].summonerLevel
                            }, function(err){
                                if(err)
                                    console.log(err);
                            });
                        }

                    });

                });

                req.on('error', (e) => {
                    console.error(e);
                });

                req.end();

            }
            console.log('findById end');
        });
        console.log('get_summonerid end');
    });

    // get matches from riot api for summoner_id
    app.get('/api/summoner/:summoner_id/loadmatches', function(req, res) {
        
        var summonerid = req.params.summoner_id;
        var date_to = new Date(2017, 2, 18).getTime();

        console.log(date_to);

        var options = {

            hostname: 'euw.api.riotgames.com',
            port: 443,
            path: '/api/lol/EUW/v2.2/matchlist/by-summoner/' + summonerid + '?rankedQueues=RANKED_FLEX_SR&endIndex=10&beginIndex=0&api_key=07b3b5ea-9c79-4856-bbc5-cd50a2aad139',
            method: 'GET'

        }           

        var req = https.request(options, (res) => {
            //console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);
            var matches_data_string = "";

            res.on('data', function(data, res) {
                
                matches_data_string += data;
                
            });

            res.on('end', function(){
                
               
                var SummonerMatchesDto = JSON.parse(matches_data_string);
                
                Summoner.findOne({_id: summonerid}, function(err, summoner){

                    if (err) console.log(err);

                    SummonerMatchesDto.matches.forEach(function(entry) {
                    
                        console.log(entry.matchId);
                        console.log('summoner id: '+summoner._id);

                        /*
                        summoner.games.push({
                            _id: entry.matchId,
                            lane: entry.lane,
                            champion: entry.champion,
                            role: entry.role,
                            timestamp: entry.timestamp
                        });
                        console.log('entry pushed');
                        */
                    });
                    /*summoner.save(function (err) {
                        if (err) return handleError(err)
                        console.log('Success!');
                    });*/

                });

            });

        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.end();
        
       

    });

    app.get('/api/summoner/:summoner_id/match/:match_id', function(req, res) {
        
        
        var match_id = req.params.match_id;

        var options = {
            hostname: 'euw.api.riotgames.com',
            port: 443,
            path: '/api/lol/EUW/v2.2/match/' + match_id + '?includeTimeline=false&api_key=07b3b5ea-9c79-4856-bbc5-cd50a2aad139',
            method: 'GET'
        }

        console.log(options.path);

        var req = https.request(options, (res) => {
            
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            
            var match_data_string = "";

            res.on('data', function(data, res) {
                
                match_data_string += data;
                
            });

            res.on('end', function(){
        
                var MatchDto = JSON.parse(match_data_string);

                console.log(MatchDto.region);

            });

            req.on('error', (e) => {
                console.error(e);
             });

            req.end();  
        });

    });

// application -------------------------------------------------------------
//    app.get('*', function(req, res) {
//        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
//    });

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");


