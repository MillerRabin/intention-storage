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

    static async json(url, { method = 'GET', headers = {}, data }) {
        const sHeaders = Object.assign({ 'Content-Type': 'application/json', 'Content-Encoding': 'identity' }, headers);
        const sData = (data == null) ? null : JSON.stringify(data);
        try {
            const result = await BrowserRequest.request(url, { method, headers: sHeaders, data: sData });
            return JSON.parse(result.text);
        } catch(err) {
            throw getJsonData(err);
        }
    }
}


async function loadDeps() {
    const [http, https, Url] = await Promise.all([
        import('http'),
        import('https'),
        import('url')
    ]);
    return {http, https, Url}
}

class Request {
    static request(url, { method = 'GET', headers = {}, data }) {
        return new Promise(async (resolve, reject) => {
            const { http, https, Url } = await loadDeps();
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
            const sData = (data == null) ? null : JSON.stringify(data);
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

export default defClass;