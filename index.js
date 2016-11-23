var http = require('https');
var querystring = require('querystring');
var csvtojson = require('csvtojson');

module.exports = function (context, req) {
    let postData = querystring.stringify({
        'email': GetEnvironmentVariable('libsyn_user'),
        'password': GetEnvironmentVariable('libsyn_password')
    });

    context.log('Post data: ' + postData);

    let options = {
        hostname: 'login.libsyn.com',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    let loginReq = http.request(options, (answer) => {
        let responseText = '';

        context.log('Login Status: ' + answer.statusCode);
        let cookies = answer.headers['set-cookie'];

        context.log('Cookies: ' + JSON.stringify(cookies));

        //answer.on('end', () => {
            context.log('Login complete, making data request');

            let dataReqOptions = {
                hostname: 'four.libsyn.com',
                port: 443,
                path: '/stats/ajax-export/show_id/53087/type/daily-totals/target/show/id/53087/',
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookies.join(";")
                }
            }
            let dataReq = http.request(dataReqOptions, (dataReqRes) => {
                context.log('Response for data request: ' + dataReqRes.statusCode);

                let data = '';
                dataReqRes.on('data', (chunk) => {
                    data += chunk;
                    context.log('Chunk received');
                });
                dataReqRes.on('end', () => {
                    context.log('Retrieved Data');

                    let converter = new csvtojson.Converter({});
                    converter.fromString(data, (e,r) => {
                        let res = {
                            status: 200,
                            body: r
                        }
                        context.done(null, res);  
                    });

                                    
                });
            });
            
            dataReq.on('error', (e) => {
                context.log('Error downloading data: ' + e.toString());
                context.done();
            });

            dataReq.end();
        //});
    });

    loginReq.on('error', (e) => {
        context.log('Error logging in: ' + e.toString());
        context.done(); 
    });

    loginReq.write(postData);
    context.log('Wrote login credentials');
    loginReq.end();    
    context.log('Sent login');
};

function GetEnvironmentVariable(name)
{
    return process.env[name];
}