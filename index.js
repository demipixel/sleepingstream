var irc = require('tmi.js');
var request = require('request');
var fs = require('fs');
var sw = require('./steamweb.js')(fs.readFileSync('./swpass', 'utf8').trim());
var ssq = require('ssq');

var ircs = ['#sleepingbear123', '#funkepills', '#pandapillowpet', '#nickster_345', '#abomb59'];
var channels = ['sleepingbear123', 'funkepills', 'pandapillowpet', 'nickster_345', 'abomb59']
var nicknames = ['Sleeping Bear', 'FUNKe', 'Panda', 'Nick', 'Abomb'];
var steamids = ['76561198046453101', '76561198044193282', '76561198084181154', '76561198072294043', '76561198049846618'];
var data = {};

var messageCount = ircs.map(i => []);

var BEAR_FACTS = fs.readFileSync('./bearfacts.txt', 'utf8').trim().split('\n');

var saymode = -1;

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
    password: fs.readFileSync('./twitchauth', 'utf8').trim()
  },
  channels: ircs
};

var whisperoptions = {
  options: options.options,
  connection: {
    random: 'group',
    reconnect: true
  },
  identity: options.identity
}

function chat(channel, msg) {
  var ind = ircs.indexOf(channel) || channels.indexOf(channel);
  if (ind != -1) {
    messageCount[ind] = messageCount[ind].filter(i => i > Date.now() - 30*1000);
  }
  if (ind != -1 && messageCount[ind].length >= 19) console.log('CAN\'T SEND MESSAGE: '+msg);
  else {
    if (ind != -1) messageCount[ind].push(Date.now());
    client.say(channel, msg);
  }
}

function whisper(user, msg) {
  whisperclient.whisper(user, msg);
}

var client = new irc.client(options);
var whisperclient = new irc.client(whisperoptions);

client.on('connected', function() {
  console.log('Connected to channels');
});

whisperclient.on('connected', function() {
  console.log('Connected to whisper server');
});

var refreshList = [];

client.on('chat', function(c, user, message, self) {
  if (self) return;
  if (!message) return;
  var me = user.username == 'demipixel';
  var lowermes = message.toLowerCase();

  var channelId = ircs.indexOf(c);
  var channel = channels[channelId];
  var nickname = nicknames[channelId];
  var id = steamids[channelId];

  refreshList.push(lowermes.indexOf('refresh') > -1 ? 1 : 0);
  if (refreshList.length > 6) refreshList.splice(0, 1);

  var totalRefreshComments = refreshList.reduce((p, c) => p + c);
  if (totalRefreshComments >= 4) {
    chat(c,'**If the stream froze** PAUSE AND RESUME or CHANGE YOUR QUALITY SETTINGS')
  }

  if (lowermes.indexOf('!demibot') == 0) {
    chat(c,'Hey @' + user.username + ' !');
  } else if (message.match(/#[^ #]*(demipixel|demi)[^ #]*/i) && !me) {
    var match = getMatches(/#([^ #]*(demipixel|demi)[^ #]*)/gi, message)
    var str = '';
    for (var m = 0; m < match.length; m++) {
      str += '#' + match[m][1].replace(/(demipixel|demi)(bot)?/gi, user.username) + ' ';
    }
    str = str.trim();
    chat(c,str);
  } else if (lowermes.indexOf('!joke') == 0) {
    request('http://api.yomomma.info/', function(err, body) {
      var joke = JSON.parse(body.body).joke.replace(/m(o|a)(m|mm)a/gi, 'boy ' + nickname).replace(/she/gi, 'he').replace(/her/gi, 'his');
      chat(c,joke);
    });
  } else if (lowermes.match(/deez( )?nut(s|z)/) && !me) {
    chat(c,'@' + user.username + ' needs to find funnier jokes.');
  } else if (lowermes.indexOf('!extrasongrequest') == 0) {
    var str = message.replace('extra', '');
    chat(c,str);
  } else if (lowermes.indexOf('!tour') == 0 || lowermes.indexOf('!mission') == 0) {
    if (data[id].mission == -1) chat(c, nickname + ' is on Tour ' + data[id].tour + '!');
    else chat (c, nickname + ' is on Tour ' + data[id].tour + ' Mission ' + data[id].mission + '!');
  } else if (lowermes.indexOf('!setmission ') == 0 && isAdmin(user)) {
    var m = parseInt(lowermes.replace('!setmission ', ''));
    if (m || m == 0) {
      if (m > 4 || m < 1) {
        chat(c,'Mission must be between 1 and 4');
      } else {
        data[id].mission = m;
        chat(c,'Seting ' + nickname + ' to Tour ' + data[id].tour + ' Mission ' + data[id].mission);
        saveSettings();
      }
    }
  } else if (lowermes.indexOf('has won the raffle!') != -1 && isAdmin(user)) {
    var match = getMatches(/(.*?) has won/gi, message);
    var winner = match[0][1];
    chat(c,'Congratulations @' + winner + '!');
  } else if (lowermes.indexOf('!ip') == 0) {
    if (data[id].showIP) chatIP(c, id, nickname);
    else chat(c,'!ip is currently disabled.')
  } else if (lowermes.indexOf('!showip') == 0 && isAdmin(user)) {
    data[id].showIP = true;
    chat(c,'You can now type !ip to see the IP of the server ' + nickname + ' is on.');
    saveSettings();
  } else if (lowermes.indexOf('!hideip') == 0 && isAdmin(user)) {
    data[id].showIP = false;
    chat(c,'!ip is now disabled.');
    saveSettings();
  } else if (lowermes.indexOf('!songlisttime') == 0) {
    request('http://api.twitch.moobot.tv/1/channel/songrequests/playlist?channel=' + channel, function(err, http, body) {
      var songs = JSON.parse(body);
      var time = 0;
      songs.forEach((song) => time += song.length);

      var seconds = time % 60;
      var minutes = Math.floor((time % 3600)/60);
      var hours = Math.floor(time / 3600);
      if (seconds < 10) seconds = '0' + seconds;
      if (minutes < 10) minutes = '0' + minutes;

      var str = 'Length of all songs in song list: ';
      if (time < 60*60) {
        str += minutes + ':' + seconds;
      } else {
        str += hours + ':' + minutes + ':' + seconds;
      }
      chat(c,str);
    });
  } else if (lowermes.indexOf('!souls') == 0) {
    if (data[id].souls == 0) {
      chat(c,'Unknown number of souls');
    } else {
      chat(c, nickname + ' has ' + data[id].souls + ' souls!');
    }
  } else if (lowermes.indexOf('!tickets') == 0) {
    chat(c, nickname + ' has ' + data[id].tickets + ' tickets!');
  } else if (lowermes.indexOf('!timeuntil ') == 0) {
    var songtext = message.replace('!timeuntil ', '').trim();
    song = '';
    var match;
    if (match = songtext.match(/.*?\?v=(.*?)(?:$|&)/)) {
      song = match[1];
    } else if (match = songtext.match(/.*?youtu.be\/(.*?)(?:$|&)/)) {
      song = match[1];
    } else song = songtext.toLowerCase();
    request('http://api.twitch.moobot.tv/1/channel/songrequests/playlist?channel='+channel, function(err, http, body) {
      try {
        var songs = JSON.parse(body);
      } catch(err) {
        chat(c, 'Uuuuuhh... Got some error trying to load the song list...');
      }
      var waittime = 0;
      for (var s = 0; s < songs.length; s++) {
        if (songs[s].youtube_id == song || songs[s].title.toLowerCase().indexOf(song) != -1) {
          var seconds = waittime % 60;
          var minutes = Math.floor((waittime % 3600)/60);
          var hours = Math.floor(waittime / 3600);
          if (seconds < 10) seconds = '0' + seconds;
          if (minutes < 10) minutes = '0' + minutes;

          if (hours == 0) {
            chat(c,'There is ' + minutes + ':' + seconds + ' until "' + songs[s].title + '"');
          } else {
            chat(c,'There is ' + hours + ':' + minutes + ':' + seconds + ' until "' + songs[s].title + '"');
          }
          return;
        } else {
          waittime += songs[s].length;
        }
      }
      chat(c,'Could not find that song!');
    });
  } else if (lowermes == '!500') {
    chat(c,'!songrequest https://www.youtube.com/watch?v=XZ4Ib-7fJqY');
  } else if (lowermes == '!hooked') {
    chat(c, '!songrequest hooked on a feeling');
  } else if (lowermes.indexOf('!duck') == 0) {
    if (user.username.toLowerCase() == 'faayyuul') chat(c,'QUACK!!!');
    else chat(c,'No');
  } else if (lowermes.indexOf('!bearluck') == 0) {
    var num = Math.floor(Math.random()*10) + 4;
    if (Math.random() < 0.01) num = '1000000000';
    chat(c, '@'+user.username+': +'+num+' Unluckiness XP')
  } else if (lowermes.indexOf('!bearfact') == 0) {
    if (user.username.toLowerCase() == 'sleepingbear123') chat(c, 'Joke #3: Bears.');
    else {
      var ind = Math.floor(Math.random() * BEAR_FACTS.length);
      chat(c, 'Bear Fact #'+(ind+1)+': '+BEAR_FACTS[ind]);
    }
  } else if (lowermes.indexOf('!<3') == 0) {
    if (user.username.toLowerCase() == 'cutenfuzzy21') chat(c, 'No.');
    else chat(c, '<3 <3 <3 <3 <3 <3 <3 <3');
  } else if (lowermes == 'opieop') {
    chat(c, 'OpieOP +');
  }
});

whisperclient.on('whisper', function(user, message) {
  var username = user.toLowerCase();
  if (message.indexOf('say ') == 0 && isAdmin(username)) {
    if (saymode == -1) whisper(user, 'Use: saymode <channel_name>');
    else {
      chat(ircs[saymode],message.replace('say ', ''));
    }
  } else if (message.indexOf('saymode ') == 0 && isAdmin(username)) {
    var channel = message.replace('saymode ', '');
    var num = channels.indexOf(channel);
    if (!num && num !== 0) {
      whisper(user, 'Cannot find demibot channel "' + channel + '"');
    } else {
      whisper(user, 'Setting saymode to "' + channel + '"');
      saymode = num;
    }
  } else {
    whisper(user, 'Invalid command');
  }
});

function isAdmin(user) {
  user = typeof user == 'object' ? user.username : user;
  return (user == 'demipixel' || user == 'sleepingbear123' || user == 'moobot');
}

function chatIP(c, id, nick) {
  sw.summary(id, function(err, players) {
    if (!players || !players.players[0] || !players.players[0].gameserverip) {
      chat(c,getStringFromServer(null,null,nick));
    } else {
      var server = players.players[0].gameserverip;
      var serverSplit = server.split(':');
      var ip = serverSplit[0];
      var port = serverSplit[1];
      ssq.info(ip, port, function(err, data) {
        chat(c,getStringFromServer(server, data));
      });
    }
  });
}

function getStringFromServer(server, data, nick) {
  if (!server) return nick + ' is not on any server!';
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

function getTour(c, id, nickname) {
  sw.items(440, id, function(err, items) {
    if (!items || !items.items) {
      console.log('Fail item get');
      return;
    }
    items = items.items;
    var ticks = items.filter((item) => item.defindex == '725').length;
    var t = items.filter((item) => item.defindex == '1066')[0];
    if (t) t = t.level;
    var s = items.filter((item) => item.defindex == '5826')[0];
    if (s) s = s.attributes[0];
    if (s) s = s.value;
    
    if (s) data[id].souls = s;

    if (!data[id].tickets) {
      
    } else if (ticks > data[id].tickets) {
      chat(c, nickname + ' bought ' + (ticks - data[id].tickets) + ' Tour of Duty tickets. He now has ' + ticks + ' tickets total.');
    } else if (ticks == data[id].tickets - 1) {
      if (data[id].mission != -1) {
        if (data[id].mission > 4) data[id].mission = -1;
        else {
          if (data[id].mission != 4) chat(c, nickname + ' has completed Tour ' + data[id].tour + ' Mission ' + data[id].mission  + '!');
          else chat(c, nickname + ' has completed Tour ' + data[id].tour + '!');
          data[id].mission++;
          saveSettings();
        }
      }
    }
    data[id].tickets = ticks;

    if (parseInt(t) && data[id].tour != t) {
      if (data[id].tour) {
        data[id].mission = 1;
        console.log(nickname + ' got new tour level: ' + data[id].tour);
        saveSettings();
      }
      data[id].tour = t;
    }
  });
}

function saveSettings(func) {
  func = func || (() => {});
  fs.writeFile('./tour', JSON.stringify(data), func);
}

function createInterval(c, text, time) {
  setTimeout(() => {
    chat(c, text);
  }, 4*1000);
  setInterval(() => {
    chat(c, text);
  }, time);
}

function tourInterval(channel, steamid, nickname) {
  setInterval(function() {
    getTour(channel, steamid, nickname);
  }, 1000*20);
}

var info = fs.existsSync('./tour') ? fs.readFileSync('./tour') : false;
if (info) {
  data = JSON.parse(info);
}
for (var channel of channels) {
  var c = channels.indexOf(channel);
  var steamid = steamids[c];
  var nickname = nicknames[c];
  getTour(channel, steamid, nickname);

  if (!data[steamid]) {
    console.log('Creating data[' + steamid + ']');
    data[steamid] = {
      souls: 0,
      mission: -1,
      tour: 0,
      tickets: 0,
      showIP: true
    }
  } else {
    console.log('Loaded data',data);
  }

  tourInterval(channel, steamid, nickname)
}

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

process.on('SIGINT', function() {
  console.log('Saving');
  saveSettings(() => {
    console.log('Saved');
    console.log('');
    process.exit();
  });
});

client.connect();
whisperclient.connect();

// createInterval('#sleepingbear123', 'Join Sleeping Bear\'s Raffle! Type !xmas for more info!', 1000*60*15);