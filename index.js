const q = require('daskeyboard-applet');
const rp = require('request-promise-native');
const logger = q.logger;

async function ping(url) {
    return rp.get({
        uri: url,
        resolveWithFullResponse: true,
        simple: false
    });
}

class ApiRequest extends q.DesktopApp {

    constructor() {
        super();

        logger.info("API-Request started");

        let interval;
        if (this.config.requestInterval !== "undefined") {
            interval = 1000 * this.config.requestInterval;
        } else {
            interval = 1000*60;
        }
        logger.info("API-REQUEST: Interval: "+interval)
        this.pollingInterval = interval;
    }

    async run() {
        return ping(this.serverUrl)
            .then(response => {
                logger.info("API-REQUEST: Request: "+response)
                let color = this.getStatusColor(response.statusCode);
                let statusString = this.getStatusString(response.statusCode);
                return ApiRequest.buildKeyboardSignal(color, this.serverUrl, statusString, response.statusCode);
            }).catch(error => ApiRequest.buildKeyboardSignal(this.failureColor, this.serverUrl, null, null, error));
    }


    get serverUrl() {
        let url = this.config.serverUrl;
        return /http(s)?\:\/\//.test(url) ? url : `http://${url}`;
    }


    get successColor() {
        return this.config.successColor || '#00ff00';
    }

    get failureColor() {
        return this.config.failureColor || '#ff0000';
    }


    getStatusString(statusCode) {
        return statusCode === 200 ? 'Success' : 'Failure';
    }

    getStatusColor(statusCode) {
        return statusCode === 200 ? this.successColor : this.failureColor;
    }

    static buildKeyboardSignal(color, url, responseStatus, responseStatuscode, err) {
        if (err)
            return q.Signal.error([`API REQUEST ERROR: ${err}`]);
        return new q.Signal({
            points: [[new q.Point(color)]],
            name: `API Request`,
            message: `API response is [${responseStatus}]  URL:[${url}]: [${responseStatuscode}]`
        });
    }
}

const applet = new ApiRequest();

module.exports = {
    ApiRequest: ApiRequest
};
