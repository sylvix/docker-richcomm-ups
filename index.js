const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDebug = process.argv[2] === '--debug';
const appPath = '/ups/ups_status';
const publicPath = path.join(__dirname, 'public');

let result = {};
let resultPreview = 'Not Available';

const parts = [
    {name: 'UPS Type', value: 'string', key: 'type'},
    {name: 'UPS Input Voltage', value: 'number', key: 'inputVoltage'},
    {name: 'UPS Rating Voltage', value: 'number', key: 'ratingVoltage'},
    {name: 'UPS Rating Current', value: 'number', key: 'ratingCurrent'},
    {name: 'UPS Line Frequency', value: 'number', key: 'lineFrequency'},
    {name: 'Communication Port', value: 'number', key: 'communicationPort'},
    {name: 'UPS Output Voltage', value: 'number', key: 'outputVoltage'},
    {name: 'Input AC Power', value: 'string', key: 'inputACPower'},
    {name: 'Battery Status', value: 'string', key: 'batteryStatus'},
    {name: 'UPS Status', value: 'string', key: 'upsStatus'},
    {name: 'UPS Power Loading', value: 'number', key: 'upsPowerLoading'},
    {name: 'Boost\/Buck', value: 'string', key: 'boostBuck'},
    {name: 'UPS Temperature', value: 'number', key: 'temperature'},
    {name: 'UPS Self-Test', value: 'string', key: 'selfTest'},
    {name: 'Beeper Status', value: 'string', key: 'beeperStatus'},
    {name: 'UPS Battery Level', value: 'number', key: 'batteryLevel'},
    {name: 'UPS Input Frequency', value: 'number', key: 'inputFrequency'},
    {name: 'ACfail Shutdown Delay', value: 'number', key: 'acFailShutdownDelay'},
    {name: 'UPS Turn Off Delay', value: 'number', key: 'upsTurnOffDelay'},
];

const keyMapOfParts = parts.reduce((acc, part) => {
    acc[part.key] = part;
    return acc;
}, {});

const getDate = () => '[' + (new Date()).toLocaleString() + ']';

const logger = (level, ...args) => {
    if (level === 'log' && !isDebug) return;
    console[level](getDate(), ...args);
}

const createParseRegex = () => {
    const regexpString = parts.reduce((acc, part) => {
        const valueRegex = part.value === 'string'? '[a-z]+' : '[\\d.]+';
        return `${acc}${part.name}\\s*:\\s*(?<${part.key}>${valueRegex}).*`;//\x1B[H\x1B[J
    }, '');

    return new RegExp(regexpString, 'gis');
};

const regexp = createParseRegex();

const removeAnsiEscapeChars = string => string.replace(/(\x9B|\x1B\[)[0-?]*[ -\/]*[@-~]/gis, '');

const transformResult = result => {
    return Object.keys(result.groups).reduce((acc, key) => {
        const type = keyMapOfParts[key].type;
        let value = result.groups[key];

        if (type === 'number') {
            value = parseFloat(value);
        }

        acc[key] = value;
        return acc;
    }, {});
}

const saveResult = string => {
    const pureString = removeAnsiEscapeChars(string);
    regexp.lastIndex = 0;
    const parseResult = regexp.exec(pureString);

    if (parseResult) {
        result = transformResult(parseResult);
    } else {
        logger('log', '==================================================');
        logger('dir', pureString);
        logger('log', '==================================================');
        logger('error', 'Result does not contain correct data for parsing!');
    }
};

const createProcess = () => {
    const app = spawn(appPath);

    const buffer = [];
    let stringBuffer = '';

    app.stdout.on('data', data => {
        buffer.push(data);
        const combined = Buffer.concat(buffer);
        const currentString = combined.toString();
        stringBuffer += currentString;

        if (stringBuffer.includes('Type \'Ctrl+C\' to Quit.')) {
            const split = stringBuffer.split('\n|| Type \'Ctrl+C\' to Quit.\n');
            stringBuffer = split[split.length - 1];
            const input = split[split.length - 2];

            const pureString = removeAnsiEscapeChars(input);
            saveResult(pureString);

            // should be exactly 25 lines for correct preview
            if (pureString.split('\n').length === 25) {
                resultPreview = pureString;
            }

            buffer.length = 0;
        }
    });

    app.on('close', () => {
        logger('info', 'Process exited for some reason! Restarting...');
        createProcess();
    });

    app.on('error', () => {
        logger('error', 'Could not create process from', appPath);
    });
};

const createServer = () => {
    const requestListener = (req, res) => {
        if (req.method.toLowerCase() === 'get') {
            if (req.url === '/') {
                const filePath = path.join(publicPath, 'index.html');
                const stat = fs.statSync(filePath);

                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Content-Length': stat.size,
                });

                const readStream = fs.createReadStream(filePath);
                return readStream.pipe(res);
            }

            if (req.url.toLowerCase() === '/data.json') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify(result));
            }

            if (req.url.toLowerCase() === '/preview.json') {
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({resultPreview}));
            }
        }

        res.writeHead(404);
        res.end('Not found!');
    };

    const server = http.createServer(requestListener);
    server.listen(8000);
}

createProcess();
createServer();

/*
      ----------===-----Welcome to ups_manager System!-----===-----
Copyright(C) 2004 Richcomm Technologies, Inc.  Dec 27 2005 ver 1.1
+-----------------------------------------------------------------------------+
| UPS Factory:                  UPS Model:             UPS Version:V3.65      |
|---------------------------------++------------------------------------------|
| UPS Type           :   StandBY  || UPS Input Voltage:   0.00 Volt           |
| UPS Rating Voltage : 220.00 Volt||  |----|----|----|----|----|----|----|----|
| UPS Rating Current :   5.00     || 180  190  200  210  220  230  240  250   |
| UPS Line Frequency :  50.00 Hz  ||                                          |
| Communication Port :      1     || UPS Output Voltage: 227.00    Volt       |
|                                 ||  |>>>>>>>>>>>>>>>>>>>>>>>-|----|----|----|
|     Input AC Power :  Bad       || 180  190  200  210  220  230   240  250  |
|     Battery Status :  Normal    ||                                          |
|     UPS Status     :  Normal    || UPS Power Loading:   0.00                |
|     Boost/Buck     :  Buck      ||  |----|----|----|----|----|----|----|----|
|     UPS Temperature:   20.80    ||  0    20   40   60   80  100  120  140   |
|     UPS Self-Test  :  Normal    ||                                          |
|     Beeper Status  :  OFF       ||  UPS Battery Level:   72.22              |
|                                 ||  |>>>>>>>>>>>>>>>>>>-|----|----|----|----|
|                                 ||  0    20   40   60   80  100  120  140   |
|                                 ||                                          |
|                                 || UPS Input Frequency :   0.00 Hz          |
| ACfail Shutdown Delay :  300 s  ||  |----|----|----|----|----|----|----|----|
| UPS Turn Off Delay    :    2 min||  0    10   20   30   40   50   60   70   |
+---------------------------------++------------------------------------------+
 */
