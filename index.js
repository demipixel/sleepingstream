var irc = require('tmi.js');
var request = require('request');
var sw = require('./steamweb.js')('7EDFF01931452753ABB0145CC12A3D49');
var fs = require('fs');
var ssq = require('ssq');

var channel = '#sleepingbear123';

var options = {
  options: {
    debug: true
  },
  connection: {
    random: 'chat',
    reconnect: true
  },
  identity: {
    username: 'demibotxel',
    password:'oauth:glxfqfv0dg990c0qpw0elhpb3k5ofr'
  },
  channels: [channel]
};

function chat(msg) {
  client.say(channel, msg);
}

var client = new irc.client(options);

client.on('connected', function() {
  //chat('Hello');
  //chat('Global Announcement: @demipixel has mined the Rune Stone at 230,630! Type !demigame to join!');
});

var refreshList = [];
var showIP = true;

client.on('chat', function(c, user, message, self) {
  if (self) return;
  if (!message) return;
  var me = user.username == 'demipixel';
  var lowermes = message.toLowerCase();

  refreshList.push(lowermes.indexOf('refresh') > -1 ? 1 : 0);
  if (refreshList.length > 6) refreshList.splice(0, 1);

  var totalRefreshComments = refreshList.reduce((p, c) => p + c);
  if (totalRefreshComments >= 4) {
    chat('**If the stream froze** PAUSE AND RESUME or CHANGE YOUR QUALITY SETTINGS')
  }

  if (lowermes.indexOf('!demibot') == 0) {
    chat('Hey @' + user.username + ' !');
  } else if (message.match(/#[^ #]*(demipixel|demi)[^ #]*/i) && !me) {
    var match = getMatches(/#([^ #]*(demipixel|demi)[^ #]*)/gi, message)
    var str = '';
    for (var m = 0; m < match.length; m++) {
      str += '#' + match[m][1].replace(/(demipixel|demi)(bot)?/gi, user.username) + ' ';
    }
    str = str.trim();
    chat(str);
  } else if (lowermes.indexOf('!joke') == 0) {
    request('http://api.yomomma.info/', function(err, body) {
      var joke = JSON.parse(body.body).joke.replace(/m(o|a)(m|mm)a/gi, 'boy Sleeping Bear').replace(/she/gi, 'he').replace(/her/gi, 'his');
      chat(joke);
    });
  } else if (lowermes.match(/deez( )?nut(s|z)/) && !me) {
    chat('@' + user.username + ' needs to find funnier jokes.');
  } else if (lowermes.indexOf('!extrasongrequest') == 0) {
    var str = message.replace('extra', '');
    chat(str);
  } else if (lowermes.indexOf('!tour') == 0 || lowermes.indexOf('!mission') == 0) {
    if (mission == -1) chat('SleepingBear is on Tour ' + tour + '!');
    else chat ('SleepingBear is on Tour ' + tour + ' Mission ' + mission + '!');
  } else if (lowermes.indexOf('!setmission ') == 0 && isAdmin(user)) {
    var m = parseInt(lowermes.replace('!setmission ', ''));
    if (m || m == 0) {
      if (m > 4 || m < 1) {
        chat('Mission must be between 1 and 4');
      } else {
        mission = m;
        chat('Seting SleepingBear to Tour ' + tour + ' Mission ' + mission);
        saveSettings();
      }
    }
  } else if (lowermes.indexOf('has won the raffle!') != -1 && user.username == 'moobot') {
    var match = getMatches(/(.*?) has won/gi, message);
    var winner = match[0][1];
    chat('Congratulations @' + winner + '!');
  } else if (lowermes.indexOf('!ip') == 0) {
    if (showIP) chatIP();
    else chat('!ip is currently disabled.')
  } else if (lowermes.indexOf('!showip') == 0 && isAdmin(user)) {
    showIP = true;
    chat('You can now type !ip to see the IP of the server Sleeping Bear is on.');
    saveSettings();
  } else if (lowermes.indexOf('!hideip') == 0 && isAdmin(user)) {
    showIP = false;
    chat('!ip is now disabled.');
    saveSettings();
  } else if (lowermes.indexOf('!songlisttime') == 0) {
    request('http://api.twitch.moobot.tv/1/channel/songrequests/playlist?channel=sleepingbear123', function(err, http, body) {
      var songs = JSON.parse(body);
      var time = 0;
      songs.forEach((song) => time += song.length);
      var str = 'Length of all songs in song list: ';
      if (time < 60*60) {
        str += Math.floor(time/60) + ':' + (time % 60);
      } else {
        str += Math.floor(time/3600) + ':' + Math.floor((time % 3600)/60) + ':' + (time % 60);
      }
      chat(str);
    })
  }
});

function isAdmin(user) {
  user = user.username || user;
  return (user == 'demipixel' || user == 'sleepingbear123');
}

lastIP = 0;
var cacheServer = '';
var cacheServerData = ''

function chatIP() {
  if (lastIP >= Date.now() - 1000*15) {
    chat(getStringFromServer(cacheServer, cacheServerData));
  } else {
    lastIP = Date.now();
    sw.summary('76561198046453101', function(err, players) {
      var server = players.players[0].gameserverip;
      if (!server) {
        chat(getStringFromServer());
        cacheServer = '';
        cacheServerData = null;
      } else {
        var serverSplit = server.split(':');
        var ip = serverSplit[0];
        var port = serverSplit[1];
        ssq.info(ip, port, function(err, data) {
          chat(getStringFromServer(server, data));
          cacheServer = server;
          cacheServerData = data;
        });
      }
    });
  }
}

function getStringFromServer(server, data) {
  if (!server) return 'Sleeping Bear is not on any server!';
  var str = server + '\n';
  str += ' (' + data.numplayers + '/' + data.maxplayers;
  str += '&nbsp' + data.map;
  str += ') ' + data.servername.replace(/ \(.*? srcds.*? #.*?\)/gi, '').replace('Mann Up ', '').replace(/ /g, '&nbsp');
  return str;
}

/*client.on('whisper', function(username, message) {
  console.log(message);
  if (message.indexOf('say ') == 0) {
    var str = message.replace('say ', '');
    console.log('Saying:' + str);
  }
});*/

var tour = 0;
var tickets = 0;
var mission = -1;

function getTour() {
  sw.items(440, '76561198046453101', function(err, items) {
    if (!items || !items.items) {
      console.log('Fail item get');
      return;
    }
    items = items.items;
    var ticks = items.filter((item) => item.defindex == '725').length;
    var t = items.filter((item) => item.defindex == '1066')[0].level;

    if (!tickets) {
      
    } else if (ticks > tickets) {
      chat('SleepingBear bought ' + (ticks - tickets) + ' Tour of Duty tickets. He now has ' + ticks + ' tickets total.');
    } else if (ticks == tickets - 1) {
      if (mission != -1) {
        if (mission > 4) mission = -1;
        else {
          if (mission != 4) chat('SleepingBear has completed Tour ' + tour + ' Mission ' + mission  + '!');
          else chat('SleepingBear has completed Tour ' + tour + '!');
          mission++;
          saveSettings();
        }
      }
    }
    tickets = ticks;

    if (parseInt(t) && tour != t) {
      if (tour) {
        mission = 1;
        console.log('Got new tour level: ' + tour);
        saveSettings();
      }
      tour = t;
    }
  });
}

function saveSettings() {
  if (tour == 0 || mission == -1) return;
  fs.writeFile('./tour', tour + ',' + mission + ',' + showIP);
}

var info = fs.existsSync('./tour') ? fs.readFileSync('./tour') : false;
if (info) {
  console.log(info.toString()); 
  var split = info.toString().split(',');
  tour = split[0];
  mission = split[1];
  showIP = typeof split[2] == 'undefined' ? true : split[2] == 'true';
}
getTour();
setInterval(getTour, 1000*20);

function getMatches(re, s) {
  var m;
  var done = Array();
  do {
    m = re.exec(s);
    if (m) {
      done.push(m);
    }
  } while (m);
  return done;
}

client.connect();