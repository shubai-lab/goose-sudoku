import ResMgr from "./ResMgr";
export var EventPoint;
(function (EventPoint) {
    EventPoint["LOGIN"] = "4";
    EventPoint["REGISTER"] = "6";
})(EventPoint || (EventPoint = {}));
export default class HttpUtils {
    constructor() {
    }
    static RequestJson(url, params, callback, errorCallBack) {
        ResMgr.GetInstance().ShowLoading();
        url = this.URL + url;
        console.log("RequestJson  ====>", url, params);
        let data = JSON.parse(JSON.stringify(params || {})) || {}, req = "";
        for (let key in data) {
            if (data[key] != null
                || data[key] != undefined) {
                req += key + "=" + data[key] + "&";
            }
        }
        params = {};
        this.Request(url, req, callback, "post", "json", null, errorCallBack);
    }
    static RequestGetJson(url, params, callback, errorCallBack) {
        ResMgr.GetInstance().ShowLoading();
        url = this.URL + url;
        let data = JSON.parse(JSON.stringify(params || {})) || {};
        for (let key in data) {
            if (data[key] != null
                || data[key] != undefined) {
                if (url.indexOf("?") > -1)
                    url += "&";
                else
                    url += "?";
                url += key + "=" + data[key];
            }
        }
        params = {};
        console.log('send request --> ', url, params);
        this.Request(url, params, callback, "get", "json", null, errorCallBack);
    }
    static Request(url, params, callback, method = "post", responseType = "text", headers, errorCallBack) {
        try {
            let xhr = new SgsHttpRequest(callback, errorCallBack);
            xhr.http.timeout = 10000;
            xhr.on("onComplete", this, this.onComplete);
            xhr.on("onError", this, this.onError);
            headers = headers || ["Content-Type", "application/x-www-form-urlencoded"];
            console.log("RequestUrl:", url, "@Params:", params);
            xhr.send(url, params, method, responseType, headers);
        }
        catch (event) {
            console.log(event);
            this.SendAjax(url, params, callback, method, responseType, headers ? headers[0] : "");
        }
    }
    static createSign(params) {
        let str = "";
        let arr = [];
        for (let item in params) {
            arr.push({
                key: item,
                value: params[item]
            });
        }
        arr.sort((a, b) => {
            return a.key < b.key ? -1 : 1;
        });
        for (let i = 0; i < arr.length; i++) {
            str += `${arr[i].key}=${arr[i].value}`;
        }
        str += HttpUtils.secret;
        let md5Res = window["md5"](str);
        return md5Res;
    }
    static SendAjax(url, params, callback, method = "", responseType = "text", contentType = "application/x-www-form-urlencoded", processData = true) {
        if (Laya.Browser.window.sendAjax) {
            Laya.Browser.window.sendAjax({ url: url, data: params, callback: callback, method: method, responseType: responseType, contentType: contentType, processData: processData });
        }
    }
    static onComplete(target, result) {
        ResMgr.GetInstance().hideLoading();
        target.callback && target.callback(result);
        target.Clear();
        target.removeEvents();
    }
    static onError(target, result) {
        console.log("http error:", result);
        ResMgr.GetInstance().hideLoading();
        target.errorCallBack && target.errorCallBack(result);
        target.Clear();
        target.removeEvents();
    }
}
HttpUtils.URL = 'http://test10thslgs.sanguosha.com/';
HttpUtils.wxLogin = "api/login";
HttpUtils.wxTestLogin = "api/testLogin";
HttpUtils.userInfo = "api/user/info";
HttpUtils.startGame = "api/game/start";
HttpUtils.doShare = "api/invite";
HttpUtils.getInviteInfo = "api/user/msg";
HttpUtils.userProp = "api/decr/item";
HttpUtils.doGameOver = "api/game/save";
HttpUtils.refreshToken = "api/refreshToken";
HttpUtils.getTokenTime = "api/getTokenTime";
HttpUtils.secret = "owkhf#wohf221kjd";
class SgsHttpRequest extends Laya.HttpRequest {
    constructor(callback, errorCallBack) {
        super();
        this.errorCallBack = errorCallBack;
        if (!window["XMLHttpRequest"]) {
            this._http = new ActiveXObject("MSXML2.XMLHTTP");
        }
        else {
        }
        this.callback = callback;
        this.on(Laya.Event.COMPLETE, this, this.onComplete);
        this.on(Laya.Event.ERROR, this, this.onError);
    }
    Clear() {
        super.clear();
        this.callback = null;
    }
    removeEvents() {
        this.offAll("onComplete");
        this.offAll("onError");
        this.offAll(Laya.Event.COMPLETE);
        this.offAll(Laya.Event.ERROR);
    }
    onComplete(result) {
        this.event("onComplete", [this, result]);
    }
    onError(result) {
        this.event("onError", [this, result]);
    }
}
//# sourceMappingURL=HttpUtils.js.map