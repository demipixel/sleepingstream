var request = require('request');

var API_KEY = '';
var POS_API_KEY = 0;

var STEAM = {};

function setAPI(str, params, version) {
	return function() {
		var obj = {};
		if (version) obj.version = version;
		for (var p in params) {
				if (typeof params[p] == 'function') continue;
		    if (!params[p] && p == 0) {
		        str = str.replace('%%', arguments[0]);
		    } else {
			    obj[params[p]] = arguments[p] || 'false';
			}
		}
		api(str, obj, arguments[arguments.length-1]);
	}
}

function init() {
	STEAM.vanity = setAPI('ISteamUser/ResolveVanityUrl', ['vanityurl']);
	STEAM.ownedGames = setAPI('IPlayerService/GetOwnedGames', ['steamid']);
	STEAM.stats = setAPI('ISteamUserStats/GetUserStatsForGame', ['steamid', 'appid'], 'v0002');
	STEAM.achievements = setAPI('ISteamUserStats/GetPlayerAchievements', ['steamid', 'appid']);
	STEAM.friends = setAPI('ISteamUser/GetFriendList', ['steamid']);
	STEAM.summary = setAPI('ISteamUser/GetPlayerSummaries', ['steamids'], 'v0002');
	STEAM.bans = setAPI('ISteamUser/GetPlayerBans', ['steamids'], 'v1');
	STEAM.level = setAPI('IPlayerService/GetSteamLevel', ['steamid']);
	STEAM.items = setAPI('IEconItems_%%/GetPlayerItems', ['', 'steamid']);
}
init();

function api(type, info, done) {
	info.version = info.version || 'v0001';
	var params = '';
	for (var i in info) {
		if (i != 'version') {
			params += '&' + i + '=' + info[i];
		}
	}
	var api_key = API_KEY;
	if (typeof API_KEY != 'string') {
		api_key = API_KEY[POS_API_KEY];
		POS_API_KEY = (POS_API_KEY + 1) % API_KEY.length;
	}
	var url = 'http://api.steampowered.com/' + type + '/' + info.version + '/?key=' + api_key + params;
	//console.log(url);
	
	request(url, function(err, resp, body) {

        try {
		    var json = JSON.parse(body);
		} catch (err) {
			console.log('url',url);
			console.log('body',body);
		    return done(err);
		}
		
		
		if (err) done(err, null);
		else done(null, json.response || json.friendslist || json.players || json.result);
	});
}

module.exports = function(apikey) {
	API_KEY = apikey;
	return STEAM;
}