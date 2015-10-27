var irc = require('tmi.js');
var request = require('request');
var sw = require('./steamweb.js')('7EDFF01931452753ABB0145CC12A3D49');

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
  channels: ['#sleepingbear123']
};

var client = new irc.client(options);

client.on('connected', function() {
  //client.say('#demipixel', 'Hello');
  //client.say('#sleepingbear123', 'Global Announcement: @demipixel has mined the Rune Stone at 230,630! Type !demigame to join!');
});

client.on('chat', function(c, user, message, self) {
  if (self) return;
  if (!message) return;
  var me = user.username == 'demipixel';
  if (message.toLowerCase().indexOf('!demibot') == 0) {
    client.say(c, 'Hey @' + user.username + ' !');
  } else if (message.match(/#([^ #]{0,15})(demipixel|demi)([^ #]{0,15})/i) && !me) {
    var match = getMatches(/#([^ #]{0,15})(demipixel|demi)([^ #]{0,15})/gi, message)
    var str = '';
    for (var m = 0; m < match.length; m++) {
      str += '#' + match[m][1] + user.username + match[m][3] + ' ';
    }
    str = str.trim();
    client.say(c, str);
  } else if (message.toLowerCase().indexOf('!joke') == 0) {
    request('http://api.yomomma.info/', function(err, body) {
      var joke = JSON.parse(body.body).joke.replace(/m(o|a)(m|mm)a/gi, 'boy Sleeping Bear').replace(/she/gi, 'he').replace(/her/gi, 'his');
      client.say(c, joke);
    });
  } else if (message.toLowerCase().match(/deez( )?nut(s|z)/) && !me) {
    client.say(c, '@' + user.username + ' needs to find funnier jokes.');
  } else if (message.toLowerCase().indexOf('!extrasongrequest') == 0) {
    var str = message.replace('extra', '');
    client.say(c, str);
  } else if (message.toLowerCase().indexOf('!tour') == 0) {
    client.say(c, 'SleepingBear is on tour ' + tour + '!');
  }
});

/*client.on('whisper', function(username, message) {
  console.log(message);
  if (message.indexOf('say ') == 0) {
    var str = message.replace('say ', '');
    console.log('Saying:' + str);
  }
});*/

var tour = 0;
var tickets = 0;

function getTour() {
  sw.items(440, '76561198046453101', function(err, items) {
    if (!items) {
      console.log('Fail item get');
      return;
    }
    items = items.items;
    var tickets = items.filter((item) => item.defindex == '725').length
    var t = items.filter((item) => item.defindex == '1066')[0].level;
    console.log(t, tour);
    if (parseInt(t) && tour != t) {
      if (tour) client.say(c, 'SleepingBear has now completed ' + t + ' tours!');
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