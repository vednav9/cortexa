const net = require('net');

const client = net.createConnection({ port: 27017, host: '89.192.9.10' }, () => {
    console.log('connected to server!');
    client.end();
});
client.on('error', (err) => {
    console.error('Error:', err);
});
