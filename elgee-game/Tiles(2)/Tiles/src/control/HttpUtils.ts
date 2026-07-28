/*
* name;
*/

import ResMgr from "./ResMgr";


export enum EventPoint {
    LOGIN = "4",
    REGISTER = "6"
}

export default class HttpUtils {
    constructor() {

    }

    // public static BaseURL: string = 'http://editortest.sanguosha.com/';



    public static URL: string = 'http://test10thslgs.sanguosha.com/';

    //正式登录
    public static wxLogin: string = "api/login";
    //测试登录
    public static wxTestLogin: string = "api/testLogin";
    //用户数据
    public static userInfo: string = "api/user/info";
    //开始游戏
    public static startGame: string = "api/game/start";
    //助力
    public static doShare: string = "api/invite";
    //获取分享信息
    public static getInviteInfo: string = "api/user/msg";
    //使用道具
    public static userProp: string = "api/decr/item";
    //结算游戏
    public static doGameOver: string = "api/game/save";
    //刷新token
    public static refreshToken: string = "api/refreshToken";
    //获取token有效时间
    public static getTokenTime: string = "api/getTokenTime";

    public static secret: string = "owkhf#wohf221kjd";

    public static RequestJson(url: string, params: any, callback: Function, errorCallBack: Function): void {
        ResMgr.GetInstance().ShowLoading();
        url = this.URL + url;
        console.log("RequestJson  ====>", url, params)
        let data = JSON.parse(JSON.stringify(params || {})) || {}, req = "";
        for (let key in data) {
            if (data[key] != null
                || data[key] != undefined) {

                req += key + "=" + data[key] + "&";
            }
        }
        params = {};

        this.Request(url, req, callback, "post", "json", null, errorCallBack)
    }

    public static RequestGetJson(url: string, params: any, callback: Function, errorCallBack: Function): void {
        ResMgr.GetInstance().ShowLoading();

        url = this.URL + url;
        let data = JSON.parse(JSON.stringify(params || {})) || {};
        for (let key in data) {
            if (data[key] != null
                || data[key] != undefined) {
                if (url.indexOf("?") > -1) url += "&";
                else url += "?";
                url += key + "=" + data[key];
            }
        }
        params = {};
        console.log('send request --> ', url, params);
        this.Request(url, params, callback, "get", "json", null, errorCallBack)
    }

    public static Request(url: string, params: any, callback: Function, method: string = "post", responseType: string = "text", headers?: any, errorCallBack?: Function): void {
        try {
            let xhr: SgsHttpRequest = new SgsHttpRequest(callback, errorCallBack);
            xhr.http.timeout = 10000;
            xhr.on("onComplete", this, this.onComplete);
            xhr.on("onError", this, this.onError);
            headers = headers || ["Content-Type", "application/x-www-form-urlencoded"];
            console.log("RequestUrl:", url, "@Params:", params);
            xhr.send(url, params, method, responseType, headers);
        } catch (event) {
            console.log(event);
            //xml html script json jsonp text ajax 不支持arraybuffer;
            this.SendAjax(url, params, callback, method, responseType, headers ? headers[0] : "");
        }
    }

    public static createSign(params) {
        let str = "";
        let arr = [];

        for (let item in params) {
            arr.push({
                key: item,
                value: params[item]
            })
        }
        // if (!params['timestamp']) {
        //     arr.push({
        //         key: "timestamp",
        //         value: timestamp
        //     })
        // }
        arr.sort((a, b) => {
            return a.key < b.key ? -1 : 1;
        })
        for (let i = 0; i < arr.length; i++) {
            str += `${arr[i].key}=${arr[i].value}`;
        }

        str += HttpUtils.secret;
        let md5Res = window["md5"](str);
        return md5Res;
    }

    public static SendAjax(url: string, params: any, callback: Function, method: string = "", responseType: string = "text", contentType: string = "application/x-www-form-urlencoded", processData: boolean = true): void {
        if (Laya.Browser.window.sendAjax) {
            Laya.Browser.window.sendAjax({ url: url, data: params, callback: callback, method: method, responseType: responseType, contentType: contentType, processData: processData });
        }
    }

    public static onComplete(target: SgsHttpRequest, result: any): void {
        //     console.log("http result:", result);
        ResMgr.GetInstance().hideLoading();
        target.callback && target.callback(result);
        target.Clear();
        target.removeEvents();
    }

    public static onError(target: SgsHttpRequest, result: any): void {
        console.log("http error:", result);
        ResMgr.GetInstance().hideLoading();
        target.errorCallBack && target.errorCallBack(result);
        target.Clear();
        target.removeEvents();
    }


}

class SgsHttpRequest extends Laya.HttpRequest {
    public callback: Function;
    public errorCallBack: Function;
    constructor(callback: Function, errorCallBack?: Function) {
        super();
        this.errorCallBack = errorCallBack;
        if (!window["XMLHttpRequest"]) {
            this._http = new ActiveXObject("MSXML2.XMLHTTP");
        } else {
        }

        this.callback = callback;
        this.on(Laya.Event.COMPLETE, this, this.onComplete);
        this.on(Laya.Event.ERROR, this, this.onError);
    }

    public Clear(): void {
        super.clear();
        this.callback = null;
    }

    public removeEvents(): void {
        this.offAll("onComplete");
        this.offAll("onError");
        this.offAll(Laya.Event.COMPLETE);
        this.offAll(Laya.Event.ERROR);
    }

    public onComplete(result: any): void {
        this.event("onComplete", [this, result]);
    }

    public onError(result: any): void {
        this.event("onError", [this, result]);
    }
}
