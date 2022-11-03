const http = require('http');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const logger = require('./middleware/eventsLogger');
const EventEmitter = require('events');

// Global variables
const PORT = process.env.PORT || 3500;

// Emitter
const emitter = new EventEmitter();
emitter.on('log', (message, file) => logger(message, file));

const serveFile = async (filePath, contentType, res) => {
    try {
        const data = await fsPromises.readFile(
            filePath,
            !contentType.includes('image') ? 'utf8' : ''
        );
        res.writeHead(
            filePath.includes('404.html') ? 404 : 200,
            { 'Content-Type': contentType }
        );
        res.end(data);
    } catch (err) {
        console.log(err);
        emitter.emit('log', `${err.message}`, 'errLogs.txt');
        res.statusCode = 500;
        res.end();
    }
};

const server = http.createServer((req, res) => {
    const extension = path.extname(req.url);
    let contentType;

    switch (extension) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.txt':
            contentType = 'text/plain';
            break;
        default:
            contentType = 'text/html';
    }

    let filePath =
    contentType === 'text/html' && req.url === '/'
        ? path.join(__dirname, 'views', 'index.html')
        : contentType === 'text/html' && req.url.slice(-1) === '/'
            ? path.join(__dirname, 'views', req.url, 'index.html')
            : contentType === 'text/html'
                ? path.join(__dirname, 'views', req.url)
                : path.join(__dirname, req.url);

    const fileExists = fs.existsSync(filePath);

    if(fileExists) {
        serveFile(filePath, contentType, res);
        emitter.emit('log', `${req.url}\t${req.method}`, 'reqLogs.txt');
    } else {
        serveFile(path.join(__dirname, 'views', '404.html'), 'text/html', res);
    }
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));