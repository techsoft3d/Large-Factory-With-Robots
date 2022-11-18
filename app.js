const express = require('express');
express.static.mime.types['wasm'] = 'application/wasm';

const fs = require("fs");

const path = require('path');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const cors = require('cors');

const demos = require('./routes/demos');
const api = require('./routes/api');
const err = require('./routes/error');

const options = {
    key: fs.readFileSync('c:/creds/livecode.key'),
    cert: fs.readFileSync('c:/creds/livecode.crt')
  };


const app = express();
const server = require('https').createServer(options, app);
const io = require('socket.io')(server);

require('./sockets/factory.js')(io);


app.all('*', cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

app.use('/', demos);
// app.use('/', index);
app.use('/api', api);
app.use('/error', err);
// app.use('/upload', upload);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error/general-error');
    //winstonLogHandler(err);
});

const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
    console.log('\nCommunicator Service Website\nApp is listening on port', server.address().port);
});

module.exports = app;
