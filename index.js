var irc = require('tmi.js');
var request = require('request');
var sw = require('./steamweb.js')('7EDFF01931452753ABB0145CC12A3D49');

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
client.on('chat', function(c, user, message, self) {
  if (self) return;
  if (!message) return;
  var me = user.username == 'demipixel';

  refreshList.push(message.toLowerCase().indexOf('refresh') > -1 ? 1 : 0);
  if (refreshList.length > 6) refreshList.splice(0, 1);

  var totalRefreshComments = refreshList.reduce((p, c) => p + c);
  if (totalRefreshComments >= 4) {
    chat('**If the stream froze** PAUSE AND RESUME or CHANGE YOUR QUALITY SETTINGS')
  }

  if (message.toLowerCase().indexOf('!demibot') == 0) {
    chat('Hey @' + user.username + ' !');
  } else if (message.match(/#([^ #]{0,15})(demipixel|demi)([^ #]{0,15})/i) && !me) {
    var match = getMatches(/#([^ #]{0,15})(demipixel|demi)([^ #]{0,15})/gi, message)
    var str = '';
    for (var m = 0; m < match.length; m++) {
      str += '#' + match[m][1] + user.username + match[m][3] + ' ';
    }
    str = str.trim();
    chat(str);
  } else if (message.toLowerCase().indexOf('!joke') == 0) {
    request('http://api.yomomma.info/', function(err, body) {
      var joke = JSON.parse(body.body).joke.replace(/m(o|a)(m|mm)a/gi, 'boy Sleeping Bear').replace(/she/gi, 'he').replace(/her/gi, 'his');
      chat(joke);
    });
  } else if (message.toLowerCase().match(/deez( )?nut(s|z)/) && !me) {
    chat('@' + user.username + ' needs to find funnier jokes.');
  } else if (message.toLowerCase().indexOf('!extrasongrequest') == 0) {
    var str = message.replace('extra', '');
    chat(str);
  } else if (message.toLowerCase().indexOf('!tour') == 0 || message.toLowerCase().indexOf('!mission') == 0) {
    if (mission == -1) chat('SleepingBear is on Tour ' + tour + '!');
    else chat ('SleepingBear is on Tour ' + tour + ' Mission ' + mission + '!');
  } else if (message.toLowerCase().indexOf('!setmission ') == 0 && isAdmin(user)) {
    var m = parseInt(message.toLowerCase().replace('!setmission ', ''));
    if (m || m == 0) {
      if (m > 4 || m < 1) {
        chat('Mission must be between 1 and 4');
      } else {
        mission = m;
        chat('Seting SleepingBear to Tour ' + tour + ' Mission ' + mission);
      }
    }
  }
});

function isAdmin(user) {
  user = user.username || user;
  return (user == 'demipixel' || user == 'sleepingbear123');
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
    if (!items) {
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
        }
      }
    }
    tickets = ticks;

    if (parseInt(t) && tour != t) {
      if (tour) {
        mission = 1;
        console.log('Got new tour level: ' + tour);
      }
      tour = t;
    }
  });
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