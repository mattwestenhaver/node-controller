var touchElem = document.getElementById('test-area')
var socket = io();
var login = $('#login')
var input = $('input')

var pos = {x: 0, y: 0, cmd: null, pw: ''};
var delta = null;
var moving = false;
var control = 'touch';
var password = '';

function makeid() {
  var poss = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++) {
    password += poss.charAt(Math.floor(Math.random() * poss.length));
  }
  $('#password-box').text(password)
}

makeid()

// connects user to the socket
socket.on('connect', () => {
  console.log('connecting to socket')
});

function enterRoom() {
  console.log('logging into room');

  // checks to see if the user enters the correct password
  if(input.val() === password) {
    socket.emit("changeRoom", "vapt1")
    touchElem.style.display = 'block'
  } else {
    console.log('incorrect password')
  }
}

// mouse functions
function emitMouse(x, y, cmd) {
  pos.x = x;
  pos.y = y;
  pos.cmd = cmd;
  socket.emit('mouse', pos);
}

function handlePan(eventName, e) {
  if (e.type == eventName + 'start') {
    delta = null;
    moving = true;
    emitMouse(0, 0, eventName + 'start');
  }
  if (e.type == eventName + 'end') {
    delta = null;
    moving = false;
    emitMouse(0, 0, eventName + 'end');
  }
  if (moving && delta != null) {
    emitMouse(e.deltaX - delta.x, e.deltaY - delta.y, eventName);
  }
  delta = {x: e.deltaX, y: e.deltaY};
}

// mouse listeners
var mc = new Hammer.Manager(touchElem)

mc.add(new Hammer.Pan(
  { 
    event: 'move', 
    threshold: 0, 
    pointers: 1,
    direction: Hammer.DIRECTION_ALL
  }
));

mc.add(new Hammer.Pan(
  {
    event: 'scroll', 
    threshold: 0, 
    pointers: 2,
    direction: Hammer.DIRECTION_ALL
  }
));

mc.add(new Hammer.Pan(
  {
    event: 'drag', 
    threshold: 0, 
    pointers: 3,
    direction: Hammer.DIRECTION_ALL
  }
));

mc.add(new Hammer.Tap(
  {
    event: 'click', 
    pointers: 1
  }
));

mc.add(new Hammer.Tap(
  {
    event: 'rightclick', 
    pointers: 2
  }
));

mc.on('movestart moveend moveup movedown moveleft moveright', (e) => {
  if (control !== 'motion') { handlePan('move', e); }
});

mc.on('scrollstart scrollend scrollup scrolldown scrollleft scrollright',
  (e) => { handlePan('scroll', e) }
);

mc.on('dragstart dragend dragup dragdown dragleft dragright', (e) => {
  handlePan('drag', e);
});

mc.on('click', (e) => {
  console.info('click');
  if (control === 'present') {
    emitMouse(0, 0, 'right');
  } else {
    emitMouse(0, 0, 'click');
  }
});

mc.on('rightclick', (e) => {
  console.info('rightclick');
  if (control === 'present') {
    emitMouse(0, 0, 'left');
  } else {
    emitMouse(0, 0, 'rightclick');
  }
});

// button event listeners
login.on('click', enterRoom)
