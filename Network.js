//${time}
const http = require('http'); //Delete for Browser environment
const https = require('https'); //Delete for Browser environment
const Url = require('url'); //Delete for Browser environment

function getJsonData(data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return { text: 'No JSON Data', error: e};
    }
}

class BrowserRequest {
    static request(url, { method = 'GET', headers = {}, data, params = {}}) {
        return new Promise((resolve, reject) => {
            const XHR = ("onload" in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
            const xhr = new XHR();
            if ((method == 'GET') && (data != null)) {
                const query = [];
                for (const key in data) {
                    if (!data.hasOwnProperty(key)) continue;
                    query.push(`${key}=${data[key]}`);
                }
                url += '?' + query.join('&');
            }
            xhr.open(method, url, true);

            xhr.onload = (event) => {
                let xhr = event.currentTarget;
                if (xhr.status >= 400)
                    return reject({ code: xhr.status, text: xhr.responseText });
                return resolve({ code: xhr.status, text: xhr.responseText });
            };

            xhr.onerror = (event) => {
                let xhr = event.currentTarget;
                reject({ code: xhr.status, text: xhr.responseText })
            };

            for (let hKey in headers) {
                if (headers.hasOwnProperty(hKey)) {
                    const line = headers[hKey];
                    xhr.setRequestHeader(hKey, line);
                }
            }

            for (let pKey in params)
                if (params.hasOwnProperty(pKey))
                    xhr[pKey] = params[pKey];

            xhr.send(data);
        });
    }

    static async browserJson(url, options) {
        const data = Object.assign({}, options);
        if (data.headers == null)
            data.headers = { 'Content-Type': 'application/json; charset=UTF-8' };

        if ((data.data) &&
            (data.method == 'POST') || (data.method == 'PUT') ||
            (data.method == 'DELETE')) {
            data.data = JSON.stringify(data.data);
            if (data.headers['Content-Encoding'] == null)
                data.headers['Content-Encoding'] = 'identity';
        }

        try {
            const result = await BrowserRequest.request(url, data);
            return JSON.parse(result.text);
        } catch(err) {
            let msg = { error: 'There was a technical failure. Please try again in a few minutes.' };
            if (err.text == null) return msg;
            try {
                msg = JSON.parse(err.text);
            }
            catch(e) {
                throw msg;
            }
            throw msg;
        }
    }
}

class Request {
    static request(url, { method = 'GET', headers = {}, data }) {
        return new Promise(function (resolve, reject) {
            const params = Url.parse(url);
            params.method = method;
            params["rejectUnauthorized"] = false;
            const protocol = (params.protocol == 'https:') ? https : http;
            params.headers = headers;
            const chunks = [];
            let pdata = null;
            if (data != null) {
                pdata = Buffer.from(data);
                params.headers['Content-Length'] = pdata.length;
            }

            const req = protocol.request(params, (res) => {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });
                res.on('end', function () {
                    if (res.statusCode >= 400) {
                        return reject(chunks.join(''));
                    }
                    return resolve(chunks.join(''));
                });
            });

            req.on('error', function (e) {
                return reject(e);
            });
            if (pdata != null)
                req.write(pdata);
            req.end();
        });
    }

    static async json(url, { method = 'GET', headers = {}, data }) {
        try {
            const sData = JSON.stringify(data);
            const sHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers);
            const results = await Request.request(url, { method, headers: sHeaders, data: sData });
            return JSON.parse(results);
        } catch (err) {
            throw getJsonData(err);
        }
    }
}

let defClass = Request;
try {
    window;
    defClass = BrowserRequest;
} catch (e) {}

module.exports = defClass;






