const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(PORT);
console.log(`Listening on 127.0.0.1: ${PORT}`);

// pass in the http server object and grab the websocket server
const io = socketio(app);

// object to hold all of our connected users
const users = {};


const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => { // change join see what happens
    // before telling them how many users are online, add them to the users object
    users[data.name] = data;
    users[data.name].user = `user${Object.keys(users).length}`;

    // message back to new user
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };
    // console.dir(socket);
    // console.dir(users);

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room`,
    };
    socket.broadcast.to('room1').emit('msg', response);
    console.log(`${data.name} joined`);
    // success message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;
  // console.dir(socket);

  socket.on('msgToServer', (data) => {
    // console.log("msg data: ");
    // console.dir(data);
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });

  socket.on('bikeshedToServer', (data) => {
    // console.dir(data);
    io.sockets.in('room1').emit('bikeshed', data);
  });

  socket.on('chatNCToServer', (data) => {
    //console.dir(data);
    io.sockets.in('room1').emit('chatNC', data);
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    // console.log("socket name that is getting deleted: ");
    // console.dir(socket.name);
    // bb code
    const message = `${socket.name} has left the room`;// bllah has left
    // console.log(socket.name);
    socket.broadcast.to('room1').emit('msg', { name: 'server', msg: message });
    socket.leave('room1');
    delete users[socket.name];
  });
};

// sorta like onRequest but more static, sticks around, more stateless,
// .stdin - command line input
// io.sockets.in('room1').emit sends to everrryonneeee
// broadcast sends to all but sender
// emit sends to just the sender
io.sockets.on('connection', (socket) => { // more sockets magic
  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
