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
    username: 'sleepingbearbot',
    password:'oauth:ldtpa73rkof7wk8rs0jbtmj8wj5vie'
  },
  channels: [channel]
};

var whisperoptions = {
  options: options.options,
  connection: {
    random: 'group',
    reconnect: true
  },
  identity: options.identity
}

function chat(msg) {
  client.say(channel, msg);
}

function whisper(user, msg) {
  whisperclient.whisper(user, msg);
}

var client = new irc.client(options);
var whisperclient = new irc.client(whisperoptions);

client.on('connected', function() {
  //chat('Hello');
  //chat('Global Announcement: @demipixel has mined the Rune Stone at 230,630! Type !demigame to join!');
});

whisperclient.on('connected', function() {
  console.log('Connected to whisper server');
});

client.on('chat', function(c, user, message, self) {
  if (self) return;
  if (!message) return;

  var me = user.username == 'demipixel';
  var lowermes = message.toLowerCase();

  if (lowermes.indexOf('!bearbot') == 0) {
    chat('Hey @' + user.username + ' !');
  }
});

whisperclient.on('whisper', function(user, message) {
  var username = user.toLowerCase();
  if (message.indexOf('say ') != -1 && isAdmin(username)) {
    chat(message.replace('say ', ''));
  }
});

function isAdmin(user) {
  user = typeof user == 'object' ? user.username : user;
  return (user == 'demipixel' || user == 'sleepingbear123');
}


client.connect();
whisperclient.connect();