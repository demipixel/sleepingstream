var irc = require('tmi.js');
var fs = require('fs');

var channel = '#twitchinstallsarchlinux';

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

var client = new irc.client(options);

client.on('connected', function() {
  console.log('Connected');
});

var str = '';

client.on('chat', (channel, user, message, self) => {
  if (self) return;
  if (true) str += '\n' + user.username + ':' + message;
});

setInterval(() => {
  fs.appendFile('./arch', str, () => console.log('Saved'));
  str = '';
}, 1000*7);

client.connect();