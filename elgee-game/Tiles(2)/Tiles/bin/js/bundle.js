(function () {
    'use strict';

    class PoolMgr {
        constructor() {
            this.pool = [];
        }
        static GetInstance() {
            if (!this._instance) {
                this._instance = new PoolMgr();
            }
            return this._instance;
        }
        GetPoolObject(key) {
            let object = null;
            let keys = key.split(".");
            if (!this.pool[key] || this.pool[key].length <= 0) {
                object = fgui.UIPackage.createObject(keys[0], keys[1]);
            }
            else {
                object = this.pool[key].pop();
            }
            object.scaleX = object.scaleY = 1;
            object.visible = true;
            object.sortOrder = 0;
            object['$isFlyed'] = false;
            return object;
        }
        Recover(key, object) {
            if (!this.pool[key])
                this.pool[key] = [];
            this.pool[key].push(object);
        }
    }
    PoolMgr._instance = null;

    class TilesItem extends fgui.GButton {
        init(mapData) {
            this.mapData = mapData;
            this.setXY(ResMgr.GetInstance().OffSet.X + mapData.X, ResMgr.GetInstance().OffSet.Y + mapData.Y);
            this.onClick(this, this.ClickItem, [this]);
            this.icon = ResMgr.GetInstance().GetIconUrl(this.mapData.Type + "");
        }
        ClickItem(item) {
            if (item.mapData.Status == ShapeStatusType.DISABLE) {
                return;
            }
            mvc.event(MsgType.CLICK_TILES, item);
        }
        UpdateStatus() {
            let canClick = this.mapData.Status == ShapeStatusType.ENABLE;
            this.getController('hasMask').selectedIndex = canClick ? 0 : 1;
        }
        IsClickDipose() {
            return this.mapData.Area == ShapeAreaType.COLLECTION;
        }
        IsDispose() {
            return this.mapData.Area == ShapeAreaType.INVALID;
        }
    }

    var Error_Code;
    (function (Error_Code) {
        Error_Code[Error_Code["TOKEN_INVALID"] = 401] = "TOKEN_INVALID";
    })(Error_Code || (Error_Code = {}));
    ;
    class UserMgr {
        constructor() {
            this._info = {
                "nickname": "",
                "avatar": "",
                "daily_win": "4",
                "daily_game": "5",
                "total_win": "4",
                "total_game": "5",
                "invite_code": "",
                "share_num": 0,
                "share_item": 0
            };
            this.data = { expires_in: 0, token: "" };
            this._musicSet = true;
            this.jumpHttp = true;
            this.game_id = 0;
            this.code = "";
            this.MIN_TOKEN_TIME = 60 * 60;
            this.GameUrl = "https://10thwxh5.sanguosha.com/slgs/index.html";
            this.isGetInfo = false;
            this.startTimeInterval = null;
            this.time = 0;
        }
        static GetInstance() {
            if (!this._instance) {
                this._instance = new UserMgr();
            }
            return this._instance;
        }
        get musicSet() {
            return this._musicSet;
        }
        init() {
            let musicSet = localStorage.getItem("MusicSet_kill");
            if (musicSet) {
                this._musicSet = JSON.parse(musicSet);
            }
            let code = getUrlParam("code");
            let token = localStorage.getItem("token_kill");
            if (this.jumpHttp) {
                this.code = "123";
                this.WxTestLogin(this.code, () => {
                    this.LoginAfter();
                }, () => {
                });
                return;
            }
            if (!code && !token) {
                this.RequestWxRedict();
            }
            else if (code) {
                this.code = code;
                this.WxLogin(this.code, () => {
                    this.LoginAfter();
                }, () => {
                });
            }
            else if (token) {
                this.data.token = token;
                this.GetTokenTime(this.data.token);
            }
        }
        LoginAfter() {
            let invite_code = getUrlParam("inviteCode");
            this.GetUserInfo(() => {
                ShareView.PreLoadShare();
            }, () => {
                mvc.event(MsgType.OPEN_NO_USER);
            });
            this.DoShare(invite_code);
            this.GetInviteInfo();
        }
        GetTokenTime(token) {
            HttpUtils.RequestGetJson(HttpUtils.getTokenTime, { token: token }, (res) => {
                if (res.code == 0) {
                    this.data.expires_in = res.data.expires_in;
                    if (this.data.expires_in <= this.MIN_TOKEN_TIME) {
                        this.refreshToken(() => {
                            this.LoginAfter();
                        }, () => {
                        });
                    }
                }
            }, () => {
            });
        }
        RequestWxRedict() {
            let invite_code = getUrlParam("inviteCode");
            let url = UserMgr.GetInstance().GameUrl;
            if (invite_code) {
                url = url + "?invite_code=" + invite_code;
            }
            location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxd4f1448ebbb567a4&redirect_uri=" + url
                + "&response_type=code&scope=snsapi_base&state=" + new Date().getTime() + "#wechat_redirect";
        }
        GetShareUrl() {
            let url = UserMgr.GetInstance().GameUrl;
            if (this._info.invite_code) {
                url = url + "?invite_code=" + this._info.invite_code;
            }
            return url;
        }
        StartGame() {
            this.time = 0;
            if (this.startTimeInterval)
                clearInterval(this.startTimeInterval);
            this.startTimeInterval = setInterval(() => {
                this.time += 1;
            }, 1000);
        }
        StopGame() {
            if (this.startTimeInterval)
                clearInterval(this.startTimeInterval);
        }
        ConvertToHMS() {
            let h = Math.floor(this.time / 3600);
            let m = Math.floor((this.time - 3600 * h) / 60);
            let s = this.time % 60;
            let str = "";
            if (h > 0) {
                str += h + "时";
            }
            str += (m < 10 ? "0" + m : m) + "分";
            str += (s < 10 ? "0" + s : s) + "秒";
            return str;
        }
        UseProp(suc, fail) {
            if (this.jumpHttp) {
                suc && suc();
                return;
            }
            if (this._info.share_item <= 0)
                return;
            HttpUtils.RequestGetJson(HttpUtils.userProp, { token: this.data.token }, (res) => {
                this.GetUserInfo(() => {
                    mvc.event(MsgType.REFRESH_USER);
                }, () => {
                });
                this.CheckCode(res);
                if (res.code == 0) {
                    suc && suc();
                }
                else {
                    fail && fail();
                }
            }, () => {
                fail && fail();
            });
        }
        GetInviteInfo() {
            HttpUtils.RequestGetJson(HttpUtils.getInviteInfo, { token: this.data.token }, (res) => {
                this.CheckCode(res);
                if (res.code == 0 && res.data.nickname != "") {
                    ViewManager.inst.popView(InvitePanel, { data: res.data });
                }
            }, null);
        }
        DoShare(invite_code) {
            if (!invite_code)
                return;
            var checkShareCode = sessionStorage.getItem(invite_code);
            console.log('checkShareCode:', checkShareCode);
            if (checkShareCode == invite_code)
                return;
            if (!checkShareCode)
                sessionStorage.setItem("invite_code", invite_code);
            HttpUtils.RequestGetJson(HttpUtils.doShare, { token: this.data.token, invite_code: invite_code }, (res) => {
                this.CheckCode(res);
            }, null);
        }
        GameOver(isWin) {
            if (this.jumpHttp)
                return;
            HttpUtils.RequestJson(HttpUtils.doGameOver, { token: this.data.token, game_id: this.game_id, result: isWin ? 1 : 0 }, (res) => {
            }, () => {
            });
            this.GetUserInfo(null, null);
        }
        GetUserInfo(suc, fail) {
            HttpUtils.RequestGetJson(HttpUtils.userInfo, { token: this.data.token }, (res) => {
                console.log(res);
                if (res.code == 0) {
                    this.isGetInfo = true;
                    this._info = res.data;
                    suc && suc();
                }
                else {
                    fail && fail();
                }
                this.CheckCode(res);
            }, () => {
                fail && fail();
            });
        }
        CheckCode(res) {
            if (res.code == 0) {
                return true;
            }
            if (res.code == Error_Code.TOKEN_INVALID) {
                this.refreshToken(this.GetUserInfo, null);
                this.WxLogin(this.code, this.GetUserInfo, null);
            }
        }
        refreshToken(suc, fail) {
            HttpUtils.RequestGetJson(HttpUtils.refreshToken, { token: this.data.token }, (res) => {
                if (res.code != 0) {
                    suc && suc();
                }
                else {
                    fail && fail();
                }
            }, () => {
                fail && fail();
            });
        }
        WxLogin(code, suc, fail) {
            HttpUtils.RequestGetJson(HttpUtils.wxLogin, { code: code }, (res) => {
                console.log(res);
                this.data = res.data;
                suc && suc();
            }, () => {
                fail && fail();
            });
        }
        WxTestLogin(code, suc, fail) {
            HttpUtils.RequestGetJson(HttpUtils.wxTestLogin, { code: code }, (res) => {
                console.log(res);
                this.data = res.data;
                suc && suc();
            }, () => {
                fail && fail();
            });
        }
        DoStart(suc, fail) {
            if (this.jumpHttp) {
                suc && suc();
                return;
            }
            HttpUtils.RequestGetJson(HttpUtils.startGame, { token: this.data.token }, (res) => {
                this.CheckCode(res);
                if (res.code != 0) {
                    fail && fail();
                }
                else {
                    this.game_id = res.data.game_id;
                    suc && suc();
                }
            }, () => {
                fail && fail();
            });
        }
        ChangeSet(set) {
            this._musicSet = set;
            localStorage.setItem("MusicSet_kill", JSON.stringify(this._musicSet));
        }
        setInfo() {
        }
        getInfo() {
            return this._info;
        }
        useProp() {
            this._info.share_item--;
        }
    }
    UserMgr._instance = null;

    var EventPoint;
    (function (EventPoint) {
        EventPoint["LOGIN"] = "4";
        EventPoint["REGISTER"] = "6";
    })(EventPoint || (EventPoint = {}));
    class HttpUtils {
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

    class ResMgr {
        constructor() {
            this.OffSet = { X: 42, Y: 50 };
        }
        static GetInstance() {
            if (!this._instance) {
                this._instance = new ResMgr();
            }
            return this._instance;
        }
        GetIconUrl(iconIndex) {
            return fgui.UIPackage.getItemURL("Tiles", iconIndex);
        }
        ShowToast(str) {
            if (!this.toast) {
                this.toast = fgui.UIPackage.createObject('Tiles', "Toast").asLabel;
            }
            this.toast.title = str;
            fgui.GRoot.inst.addChild(this.toast);
            this.toast.x = fgui.GRoot.inst.width / 2;
            this.toast.y = fgui.GRoot.inst.height / 2;
        }
        ShowLoading() {
            if (!this.loading) {
                this.loading = fgui.UIPackage.createObject("Common", "Loading").asCom;
            }
            this.loading.removeFromParent();
            fgui.GRoot.inst.addChild(this.loading);
        }
        hideLoading() {
            if (this.loading)
                this.loading.removeFromParent();
        }
    }
    ResMgr._instance = null;

    class ShareView extends Laya.Sprite {
        constructor(isJumpMain = false) {
            super();
            this.headLoaded = false;
            this.isJumpMain = false;
            this.isJumpMain = isJumpMain;
            this.initChilds();
            this.onStageResize();
            Laya.stage.on(Laya.Event.RESIZE, this, this.onStageResize);
        }
        static ShowShare(isJumpMain = false) {
            let shaderView = new ShareView(isJumpMain);
            shaderView.zOrder = Number.MAX_VALUE;
            Laya.stage.addChild(shaderView);
        }
        static PreLoadShare() {
            let userMgr = UserMgr.GetInstance();
            let userInfo = userMgr.getInfo();
            ShareView.QRCodeView = QrCodeView.CreateQRCode(121 - 6, 121 - 6, userMgr.GameUrl + "?invitecode=" + userInfo.invite_code, "shader/logoIcon.jpg", 35, 35);
            Laya.loader.load(userInfo.avatar, null, null, "image");
        }
        initChilds() {
            let userInfo = UserMgr.GetInstance().getInfo();
            if (!userInfo) {
                if (this.isJumpMain)
                    mvc.event(MsgType.JUMP_MAIN);
                this.destroy();
                return;
            }
            this.maskSp = new Laya.Sprite();
            this.maskSp.alpha = 0.5;
            this.maskSp.on(Laya.Event.CLICK, this, this.onStageClick);
            this.addChild(this.maskSp);
            this.reference = new Laya.Sprite();
            this.reference.size(453, 784);
            this.addChild(this.reference);
            this.contentSp = new Laya.Sprite();
            this.contentBg = new Laya.Image();
            this.contentBg.source = Laya.loader.getRes("shader/shaderBg.png");
            this.contentSp.addChild(this.contentBg);
            this.headImage = new Laya.Image();
            this.headImage.pos(72, 1166);
            this.headImage.size(84, 84);
            this.contentSp.addChild(this.headImage);
            this.nameText = new Laya.Text();
            this.nameText.pos(183, 1166 + 32);
            this.nameText.color = "#FFFFFF";
            this.nameText.fontSize = 24;
            this.nameText.text = userInfo.nickname;
            this.contentSp.addChild(this.nameText);
            this.battleCountText = new Laya.Text();
            this.battleCountText.pos(183, 1166 + 64);
            this.battleCountText.color = "#FFFFFF";
            this.battleCountText.fontSize = 24;
            this.battleCountText.text = "已挑战 " + userInfo.total_game + "次";
            this.contentSp.addChild(this.battleCountText);
            this.passCountText = new Laya.Text();
            this.passCountText.pos(183, 1166);
            this.passCountText.color = "#FFFFFF";
            this.passCountText.fontSize = 24;
            this.passCountText.text = "已通关 " + userInfo.total_win + "次";
            this.contentSp.addChild(this.passCountText);
            this.qrCodeView = ShareView.QRCodeView;
            this.qrCodeView.pos(534 + 3, 1039 + 3);
            this.contentSp.addChild(this.qrCodeView);
            this.closeBtn = new Laya.Image();
            this.closeBtn.source = Laya.loader.getRes("shader/shaderClose.png");
            this.closeBtn.visible = false;
            this.closeBtn.on(Laya.Event.CLICK, this, this.onCloseHandler);
            this.addChild(this.closeBtn);
            this.tipImage = new Laya.Image();
            this.tipImage.source = Laya.loader.getRes("shader/shaderText.png");
            this.tipImage.visible = false;
            this.addChild(this.tipImage);
            let self = this;
            Laya.loader.load(userInfo.avatar, Laya.Handler.create(this, function (url, data) {
                if (self.destroyed)
                    return;
                self.headImage.source = data;
                self.headLoaded = true;
                Laya.timer.once(50, self, self.onMergeImg);
            }, [userInfo.avatar]), null, "image");
        }
        onMergeImg() {
            var htmlC = this.contentSp.drawToCanvas(750, 1300, 0, 0);
            var base64 = htmlC.toBase64("image/png", 1);
            htmlC.destroy();
            if (this.qrCodeView) {
                this.qrCodeView.removeSelf();
                this.qrCodeView = null;
            }
            if (this.contentSp) {
                this.contentSp.destroy();
                this.contentSp = null;
            }
            this.imgElement = document.getElementById("mergeImg");
            if (this.imgElement)
                this.imgElement.style.display = "block";
            else {
                this.imgElement = document.createElement("img");
                this.imgElement.id = "mergeImg";
                this.imgElement.crossOrigin = "";
                document.getElementById("layaContainer").appendChild(this.imgElement);
            }
            this.imgElement.src = base64;
            Laya.Utils.fitDOMElementInArea(this.imgElement, this.reference, 0, 0, this.reference.width, this.reference.height);
            this.closeBtn.visible = this.tipImage.visible = true;
        }
        onStageClick(event) {
        }
        onStageResize() {
            this.size(Laya.stage.width, Laya.stage.height);
            this.maskSp.graphics.clear();
            this.maskSp.size(this.width, this.height);
            this.maskSp.graphics.drawRect(0, 0, this.width, this.height, "#000000");
            this.reference.pos(this.width - this.reference.width >> 1, this.height - (this.reference.height + 184) >> 1);
            this.closeBtn.pos(625, this.reference.y - 67);
            this.tipImage.pos(109, this.reference.y + this.reference.height + 39);
            if (this.imgElement)
                Laya.Utils.fitDOMElementInArea(this.imgElement, this.reference, 0, 0, this.reference.width, this.reference.height);
        }
        onCloseHandler() {
            if (this.isJumpMain)
                mvc.event(MsgType.JUMP_MAIN);
            this.destroy();
        }
        destroy() {
            Laya.timer.clearAll(this);
            if (this.qrCodeView) {
                this.qrCodeView.removeSelf();
                this.qrCodeView = null;
            }
            if (this.contentSp) {
                this.contentSp.destroy();
                this.contentSp = null;
            }
            if (this.imgElement) {
                this.imgElement.src = "";
                this.imgElement.style.display = "none";
                this.imgElement = null;
            }
            super.destroy();
        }
    }

    class QrCodeView extends Laya.Sprite {
        constructor() {
            super();
            this.logoUrl = "";
            this.qrcodeLoaded = false;
            this.logoLoaded = false;
            this.qrImage = new Laya.Image();
            this.addChild(this.qrImage);
            this.logoImage = new Laya.Image();
            this.addChild(this.logoImage);
        }
        static CreateQRCode(width, height, text, logoUrl = "", logoWidth = 0, logoHeight = 0) {
            let qrView = new QrCodeView();
            qrView.UpdateQRCode(width, height, text, logoUrl, logoWidth, logoHeight);
            return qrView;
        }
        UpdateQRCode(width, height, text, logoUrl = "", logoWidth = 0, logoHeight = 0) {
            if (!Laya.Browser.window.QRCode) {
                this.checkLoadEnd();
                return;
            }
            this.qrImage.skin = this.logoImage.skin = null;
            this.qrImage.source = this.logoImage.source = null;
            this.qrImage.visible = this.logoImage.visible = false;
            this.qrcodeLoaded = false;
            this.logoLoaded = false;
            this.size(width, height);
            this.updateQRCode(text, width, height);
            this.updateLogo(logoUrl, logoWidth, logoHeight);
        }
        updateQRCode(text, width, height) {
            if (this.qrcode) {
                this.qrcode.clear();
                if (this.qrcode["_htOption"].width != width || this.qrcode["_htOption"].height != height)
                    this.qrcode = null;
            }
            if (!this.qrcode) {
                if (!this.qrcodeDiv)
                    this.qrcodeDiv = Laya.Browser.document.createElement("div");
                this.qrcode = new Laya.Browser.window.QRCode(this.qrcodeDiv, { width: width, height: height });
            }
            this.qrcode.makeCode(text);
            let self = this;
            Laya.timer.once(1000, this, function () {
                if (self.destroyed)
                    return;
                self.qrcodeLoaded = true;
                self.qrImage.skin = self.qrcode._oDrawing._elImage.src;
                self.checkLoadEnd();
            });
        }
        updateLogo(logoUrl = "", logoWidth = 0, logoHeight = 0) {
            this.logoUrl = logoUrl;
            if (!logoUrl) {
                this.checkLoadEnd();
                return;
            }
            if (logoWidth)
                this.logoImage.width = logoWidth;
            if (logoHeight)
                this.logoImage.height = logoHeight;
            let self = this;
            let logoTexture = Laya.loader.getRes(logoUrl);
            if (logoTexture) {
                self.logoLoaded = true;
                self.logoImage.source = logoTexture;
                self.logoImage.pos(self.width - self.logoImage.width >> 1, self.height - self.logoImage.height >> 1);
                self.checkLoadEnd();
            }
            else {
                Laya.loader.load(logoUrl, Laya.Handler.create(this, function (url, data) {
                    if (self.destroyed)
                        return;
                    if (self.logoUrl != url)
                        return;
                    self.logoLoaded = true;
                    if (!data) { }
                    else {
                        self.logoImage.source = data;
                        self.logoImage.pos(self.width - self.logoImage.width >> 1, self.height - self.logoImage.height >> 1);
                    }
                    self.checkLoadEnd();
                }, [logoUrl]), null, "image");
            }
        }
        checkLoadEnd() {
            if (!Laya.Browser.window.QRCode) {
                this.event(Laya.Event.ERROR, this);
            }
            else {
                if (this.logoUrl) {
                    if (this.qrcodeLoaded && this.logoLoaded) {
                        this.qrImage.visible = this.logoImage.visible = true;
                        this.event(Laya.Event.LOADED, this);
                    }
                }
                else if (this.qrcodeLoaded) {
                    this.qrImage.visible = this.logoImage.visible = true;
                    this.event(Laya.Event.LOADED, this);
                }
            }
        }
    }

    class Scene {
        constructor() {
            this._showTimes = 0;
            this.openData = null;
        }
        get view() {
            return this._view;
        }
        init(packageName, viewName) {
            this._view = fgui.UIPackage.createObject(packageName, viewName).asCom;
            this._view.makeFullScreen();
        }
        onShown(...args) {
            this.openData = args;
            if (this._showTimes == 0) {
                this.bindChild();
            }
            this._showTimes++;
            this.refresh();
        }
        getButton(btnName, node) {
            var nodes = this.getComponent(btnName, node);
            if (nodes) {
                nodes.onClick(this, this.onClickButton, [nodes.asButton]);
                return nodes.asButton;
            }
        }
        getImage(name, node) {
            var nodes = this.getComponent(name, node);
            return nodes.asImage;
        }
        getList(name, node) {
            var nodes = this.getComponent(name, node);
            return nodes.asList;
        }
        getTextField(name, node) {
            var nodes = this.getComponent(name, node);
            return nodes.asTextField;
        }
        getLabel(name, node) {
            var nodes = this.getComponent(name, node);
            return nodes.asLabel;
        }
        getComponent(name, node) {
            if (!node) {
                node = this.view;
            }
            var sp = name.split(".");
            var i = 0;
            while (i < sp.length) {
                node = node.getChild(sp[i]).asCom;
                i++;
            }
            return node;
        }
        bindChild() {
        }
        refresh() {
        }
        onHide() {
            this._view.removeFromParent();
        }
        onClickButton(btn) {
        }
        hide() {
            ViewManager.inst.hideView(this);
            this.onHide();
        }
        ShowAnimation() {
        }
    }

    class ViewManager {
        constructor() {
            this.view = [];
            this.vName = new Map();
            this.scene = [];
            this.NowScene = null;
            this.NowView = [];
            this.mode = null;
            this.views = null;
            this.all = [];
            this.noUserView = null;
        }
        static get inst() {
            if (!this._instance) {
                this._instance = new ViewManager();
            }
            return this._instance;
        }
        popView(view, ...args) {
            var index = -1;
            for (let i = 0; i < this.view.length; i++) {
                if (this.view[i] instanceof view) {
                    index = i;
                    break;
                }
            }
            var cls = null;
            if (index <= -1) {
                cls = new view();
                cls.init('a', 'b');
                this.view.push(cls);
            }
            else {
                cls = this.view[index];
            }
            cls.onShown(...args);
            this.NowView.push(cls);
            if (!this.mode) {
                this.mode = new fgui.GGraph();
                this.mode.setSize(750, 2000);
                this.mode.drawRect(0, "#ffffff", "#000000");
                this.mode.y = -300;
                this.mode.alpha = 0.6;
            }
            if (!this.views) {
                this.views = new fgui.GComponent();
            }
            this.views.removeChildren();
            this.views.addChild(this.mode);
            this.views.addChild(cls.view);
            this.all.push(cls);
            fgui.GRoot.inst.addChild(this.views);
            cls.view.makeFullScreen();
        }
        popScene(scene, ...args) {
            if (this.NowScene) {
                this.NowScene.onHide();
                fgui.GRoot.inst.removeChild(this.NowScene.view);
            }
            if (this.NowView.length > 0) {
                for (let i = 0; i < this.NowView.length; i++) {
                    fgui.GRoot.inst.removeChild(this.NowView[i].view);
                }
                this.NowView = [];
            }
            this.all = [];
            var cls = null;
            var index = -1;
            for (let i = 0; i < this.scene.length; i++) {
                if (this.scene[i] instanceof scene) {
                    index = i;
                    break;
                }
            }
            if (index <= -1) {
                cls = new scene();
                cls.init('a', 'b');
                this.scene.push(cls);
            }
            else {
                cls = this.scene[index];
            }
            cls.onShown(...args);
            this.NowScene = cls;
            this.all.push(cls);
            fgui.GRoot.inst.addChild(cls.view);
            cls.view.makeFullScreen();
        }
        hideView(view) {
            for (let i = 0; i < this.NowView.length; i++) {
                if (this.NowView[i].constructor === view.constructor) {
                    this.NowView.splice(i, 1);
                    break;
                }
            }
            this.views.removeFromParent();
            this.all.pop();
            let len = this.all.length;
        }
        getScene(scene) {
            var cls = null;
            for (let i = 0; i < this.scene.length; i++) {
                if (this.scene[i] instanceof scene) {
                    cls = this.scene[i];
                    break;
                }
            }
            return cls;
        }
        showToast(msg) {
            if (!this.toast) {
                this.toast = fgui.UIPackage.createObject('Game', 'toast').asLabel;
            }
            this.toast.title = msg;
            this.toast.x = (fgui.GRoot.inst.width) / 2;
            this.toast.y = (fgui.GRoot.inst.height / 2);
            this.toast.getTransition('t0').play();
            fgui.GRoot.inst.addChild(this.toast);
        }
    }
    ViewManager._instance = null;

    class MapDataController extends Laya.EventDispatcher {
        constructor() {
            super();
            this.levelDic = {};
            this.layerDic = {};
            this.MAX_QUEUE_TILES = 7;
            this.rect1 = Laya.Rectangle.create();
            this.rect2 = Laya.Rectangle.create();
        }
        static GetInstance() {
            if (MapDataController.instance == null)
                MapDataController.instance = new MapDataController();
            return MapDataController.instance;
        }
        ParseConfig(data) {
            if (!data)
                return;
            let levelConf = data.LevelConf;
            if (levelConf) {
                levelConf.forEach(element => {
                    if (!this.levelDic[element.Level])
                        this.levelDic[element.Level] = [element];
                    else
                        this.levelDic[element.Level].push(element);
                });
            }
            let layoutConf = data.LayoutConf;
            if (layoutConf) {
                layoutConf.forEach(element => {
                    this.layerDic[element.ID] = element;
                });
            }
        }
        HasNextLevel(level) {
            let keys = Object.keys(this.levelDic);
            let minLevel = 99999;
            for (let i = 0; i < keys.length; i++) {
                if (level < keys[i]) {
                    minLevel = minLevel > +keys[i] ? +keys[i] : minLevel;
                }
            }
            return minLevel;
        }
        StartLevel(level) {
            this.curLevelMap = [];
            if (!level) {
                console.log("非法关卡");
                return this.curLevelMap;
            }
            let levelInfo = this.randomLevel(level);
            if (!levelInfo) {
                console.log("未在配置中找到此关卡: " + level);
                return this.curLevelMap;
            }
            if (!levelInfo.Layers || levelInfo.Layers.length <= 0) {
                console.log("此关卡没有配置层级: " + levelInfo.ID);
                return this.curLevelMap;
            }
            let gridCount = 0;
            let confirmCount = 0;
            let randomedCount = 0;
            let randomedDic = {};
            let randomedTypes = [];
            let layerInfo;
            let layerGrids;
            let layerIndex = 0;
            let shapeGridVo;
            levelInfo.Layers.forEach(element => {
                layerInfo = this.getLayerByID(element);
                if (layerInfo && layerInfo.Layout && layerInfo.Layout.length > 0 && layerInfo.Weight && layerInfo.Weight.length > 0) {
                    layerGrids = [];
                    layerInfo.Layout.forEach(elementLayer => {
                        shapeGridVo = ShapeGridVO.GetInstance(layerIndex, layerGrids.length, elementLayer, new LayerWeightVO(layerInfo.Weight));
                        if (shapeGridVo) {
                            layerGrids.push(shapeGridVo);
                            gridCount++;
                            if (shapeGridVo.Type > 0) {
                                confirmCount++;
                                if (randomedDic[shapeGridVo.Type]) {
                                    randomedDic[shapeGridVo.Type] = randomedDic[shapeGridVo.Type] - 1;
                                    randomedCount = randomedCount - 1;
                                    if (randomedDic[shapeGridVo.Type] <= 0) {
                                        delete randomedDic[shapeGridVo.Type];
                                        let index = randomedTypes.indexOf(shapeGridVo.Type);
                                        if (index >= 0)
                                            randomedTypes.splice(index, 1);
                                    }
                                }
                                else {
                                    randomedDic[shapeGridVo.Type] = 2;
                                    randomedCount = randomedCount + 2;
                                    randomedTypes.push(shapeGridVo.Type);
                                }
                            }
                        }
                    });
                    this.curLevelMap.push(layerGrids);
                    layerIndex++;
                }
            });
            if (this.curLevelMap.length <= 0) {
                console.log("此关卡没有合法层级: " + levelInfo.ID);
                return this.curLevelMap;
            }
            if (gridCount % 3 != 0) {
                console.log("此关卡格子数不是3的倍数: " + levelInfo.ID);
            }
            let gridWidth = 84 - 4;
            let gridHeight = 100 - 11;
            let layerLen = this.curLevelMap.length;
            let layerInfos;
            for (let i = layerLen - 1; i >= 0; i--) {
                layerInfos = this.curLevelMap[i];
                for (let j = 0; j < layerInfos.length; j++) {
                    shapeGridVo = layerInfos[j];
                    this.lookAfterGrid(gridWidth, gridHeight, shapeGridVo);
                    if (shapeGridVo.Type <= 0) {
                        let leftRandomCount = gridCount - confirmCount - randomedCount;
                        let shapeType = shapeGridVo.RandomType();
                        if (leftRandomCount < 3) {
                            if (randomedTypes.length > 0) {
                                if (!randomedDic[shapeType]) {
                                    shapeType = shapeGridVo.RandomType();
                                    if (!randomedDic[shapeType])
                                        shapeType = shapeGridVo.RandomType();
                                }
                                if (!randomedDic[shapeType]) {
                                    let random = Math.floor(Math.random() * randomedTypes.length);
                                    shapeType = randomedTypes[random];
                                }
                                randomedDic[shapeType] = randomedDic[shapeType] - 1;
                                randomedCount = randomedCount - 1;
                                if (randomedDic[shapeType] <= 0) {
                                    delete randomedDic[shapeType];
                                    let index = randomedTypes.indexOf(shapeType);
                                    if (index >= 0)
                                        randomedTypes.splice(index, 1);
                                }
                            }
                            else {
                            }
                        }
                        else {
                            if (randomedDic[shapeType])
                                randomedDic[shapeType] = randomedDic[shapeType] + 2;
                            else {
                                randomedDic[shapeType] = 2;
                                randomedTypes.push(shapeType);
                            }
                            randomedCount = randomedCount + 2;
                        }
                        confirmCount++;
                        shapeGridVo.Type = shapeType;
                    }
                }
            }
            for (let i = 0; i < layerLen; i++) {
                layerInfos = this.curLevelMap[i];
                for (let j = 0; j < layerInfos.length; j++) {
                    shapeGridVo = layerInfos[j];
                    if (!shapeGridVo.IsExistBeforeGrid)
                        shapeGridVo.Status = ShapeStatusType.ENABLE;
                }
            }
            let testDic = {};
            for (let i = 0; i < layerLen; i++) {
                layerInfos = this.curLevelMap[i];
                for (let j = 0; j < layerInfos.length; j++) {
                    shapeGridVo = layerInfos[j];
                    if (testDic[shapeGridVo.Type]) {
                        testDic[shapeGridVo.Type] = testDic[shapeGridVo.Type] + 1;
                    }
                    else {
                        testDic[shapeGridVo.Type] = 1;
                    }
                }
            }
            for (let type in testDic) {
                if (testDic[type] % 3 != 0) {
                    alert("存在不是3倍数的形状：" + type + "_" + testDic[type]);
                    break;
                }
            }
            return this.curLevelMap;
        }
        MoveToCollection(shapeGridVo) {
            if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.COLLECTION)
                return null;
            shapeGridVo.Area = ShapeAreaType.COLLECTION;
            let changeStatus = [];
            let afterGrids = shapeGridVo.AfterGrids;
            if (!afterGrids || afterGrids.length <= 0)
                return;
            let afterShapeGridVO;
            for (let i = 0; i < afterGrids.length; i++) {
                afterShapeGridVO = afterGrids[i];
                if (afterShapeGridVO.Status == ShapeStatusType.DISABLE) {
                    let isEnable = true;
                    let beforeGrids = afterShapeGridVO.BeforeGrids;
                    if (beforeGrids && beforeGrids.length > 0) {
                        for (let j = 0; j < beforeGrids.length; j++) {
                            if (beforeGrids[j].Area == ShapeAreaType.OPERATION) {
                                isEnable = false;
                                break;
                            }
                        }
                    }
                    if (isEnable) {
                        afterShapeGridVO.Status = ShapeStatusType.ENABLE;
                        changeStatus.push(afterShapeGridVO);
                    }
                }
            }
            return changeStatus;
        }
        MoveToOperation(shapeGridVo) {
            if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.OPERATION)
                return null;
            shapeGridVo.Area = ShapeAreaType.OPERATION;
            let changeStatus = [];
            let afterGrids = shapeGridVo.AfterGrids;
            if (!afterGrids || afterGrids.length <= 0)
                return;
            let afterShapeGridVO;
            for (let i = 0; i < afterGrids.length; i++) {
                afterShapeGridVO = afterGrids[i];
                if (afterShapeGridVO.Status != ShapeStatusType.DISABLE) {
                    afterShapeGridVO.Status = ShapeStatusType.DISABLE;
                    changeStatus.push(afterShapeGridVO);
                }
            }
            return changeStatus;
        }
        MoveToLogic(shapeGridVo) {
            if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.LOGIC)
                return null;
            shapeGridVo.Area = ShapeAreaType.LOGIC;
            shapeGridVo.Status = ShapeStatusType.ENABLE;
        }
        MoveToInvalid(shapeGridVo) {
            if (!shapeGridVo || shapeGridVo.Area == ShapeAreaType.INVALID)
                return null;
            ShapeGridVO.Recover(shapeGridVo);
        }
        randomLevel(level) {
            let levelList = this.levelDic[level];
            if (!levelList || levelList.length <= 0)
                return null;
            let randIndex = Math.floor(Math.random() * levelList.length);
            return levelList[randIndex];
        }
        getLayerByID(id) {
            return this.layerDic[id];
        }
        lookAfterGrid(gridWidth, gridHeight, shapeGridVo) {
            if (shapeGridVo.LayerIndex <= 0)
                return;
            this.rect1.setTo(shapeGridVo.X, shapeGridVo.Y, gridWidth, gridHeight);
            let layerInfos;
            let afterShapeGridVO;
            for (let i = shapeGridVo.LayerIndex - 1; i >= 0; i--) {
                layerInfos = this.curLevelMap[i];
                for (let j = 0; j < layerInfos.length; j++) {
                    afterShapeGridVO = layerInfos[j];
                    this.rect2.setTo(afterShapeGridVO.X, afterShapeGridVO.Y, gridWidth, gridHeight);
                    if (this.rect1.intersects(this.rect2)) {
                        shapeGridVo.AddAfterGrid(afterShapeGridVO);
                        afterShapeGridVO.AddBeforeGrid(shapeGridVo);
                    }
                }
            }
        }
    }

    class ShapeGridVO {
        constructor() {
            this.LayerIndex = 0;
            this.GridIndex = 0;
            this.X = 0;
            this.Y = 0;
            this.Type = 0;
            this.Status = ShapeStatusType.DISABLE;
            this.Area = ShapeAreaType.OPERATION;
        }
        static GetInstance(layerIndex, gridIndex, layoutInfo, weight) {
            if (!layoutInfo || !weight)
                return null;
            let shapeGrid = Laya.Pool.getItemByClass("ShapeGridVO", ShapeGridVO);
            shapeGrid.ResetData(layerIndex, gridIndex, layoutInfo, weight);
            return shapeGrid;
        }
        static Recover(instance) {
            if (!instance)
                return;
            instance.ClearData();
            Laya.Pool.recover("ShapeGridVO", instance);
        }
        ResetData(layerIndex, gridIndex, layoutInfo, weight) {
            this.LayerIndex = layerIndex;
            this.GridIndex = gridIndex;
            this.X = layoutInfo.X;
            this.Y = layoutInfo.Y;
            this.Type = layoutInfo.Type;
            this.weight = weight;
            this.Status = ShapeStatusType.DISABLE;
            this.Area = ShapeAreaType.OPERATION;
            this.beforeGrids = null;
            this.afterGrids = null;
        }
        ClearData() {
            this.LayerIndex = 0;
            this.GridIndex = 0;
            this.X = 0;
            this.Y = 0;
            this.Type = 0;
            this.Status = ShapeStatusType.DISABLE;
            this.Area = ShapeAreaType.INVALID;
            this.weight = null;
            this.beforeGrids = null;
            this.afterGrids = null;
        }
        AddBeforeGrid(shapeGridVo) {
            if (!this.beforeGrids)
                this.beforeGrids = [];
            this.beforeGrids.push(shapeGridVo);
        }
        AddAfterGrid(shapeGridVo) {
            if (!this.afterGrids)
                this.afterGrids = [];
            this.afterGrids.push(shapeGridVo);
        }
        get BeforeGrids() {
            return this.beforeGrids;
        }
        get AfterGrids() {
            return this.afterGrids;
        }
        get IsExistBeforeGrid() {
            return this.beforeGrids && this.beforeGrids.length > 0 ? true : false;
        }
        RandomType() {
            if (this.Type != 0)
                return this.Type;
            return this.weight.RandomType();
        }
    }

    class ShapeStatusType {
    }
    ShapeStatusType.DISABLE = 1;
    ShapeStatusType.ENABLE = 2;

    class ShapeAreaType {
    }
    ShapeAreaType.INVALID = 0;
    ShapeAreaType.OPERATION = 1;
    ShapeAreaType.COLLECTION = 2;
    ShapeAreaType.LOGIC = 3;

    class LayerWeightVO {
        constructor(weight) {
            this.totalWeight = 0;
            this.weight = [];
            this.totalWeight = 0;
            let startWeight = 0;
            for (let i = 0; i < weight.length; i++) {
                this.weight.push({ Type: weight[i].Type, StartWeight: startWeight, EndWeight: startWeight + weight[i].Weight });
                startWeight += weight[i].Weight;
            }
            this.totalWeight = startWeight;
        }
        RandomType() {
            let random = Math.floor(Math.random() * this.totalWeight);
            let weightItem;
            for (let i = 0; i < this.weight.length; i++) {
                weightItem = this.weight[i];
                if (random >= weightItem.StartWeight && random <= weightItem.EndWeight)
                    return weightItem.Type;
            }
            return 0;
        }
    }

    var MsgType;
    (function (MsgType) {
        MsgType["FGUI_COMP"] = "FGUI_COMP";
        MsgType["FGUI_LOADING"] = "FGUI_LOADING";
        MsgType["REFRESH_USER"] = "REFRESH_USER";
        MsgType["SHOW_SCORE"] = "SHOW_SCORE";
        MsgType["REFRESH_GAME"] = "REFRESH_GAME";
        MsgType["ADD_PROGERSS"] = "ADD_PROGERSS";
        MsgType["FLY_BY_PROGRESS"] = "FLY_BY_PROGRESS";
        MsgType["CLICK_TILES"] = "CLICK_TILES";
        MsgType["OPEN_NO_USER"] = "OPEN_NO_USER";
        MsgType["JUMP_MAIN"] = "JUMP_MAIN";
    })(MsgType || (MsgType = {}));
    class FguiMgr {
        constructor() {
            this.v = null;
            this.v = new Map();
            this.v["Common"] = "res/fgui/Common";
            this.v["Tiles"] = "res/fgui/Tiles";
        }
        static getInstance() {
            if (this._instance == null) {
                this._instance = new FguiMgr();
            }
            return this._instance;
        }
        loadAll() {
            let key = [
                'Common',
                'Tiles'
            ];
            this.StartLoad(key, 0);
        }
        StartLoad(keys, index) {
            if (index >= keys.length)
                return;
            let name = keys[index];
            let p = this.v[name];
            fgui.UIPackage.loadPackage(p, Laya.Handler.create(this, () => {
                console.log("load::", name);
                mvc.send(MsgType.FGUI_COMP, [name]);
                this.StartLoad(keys, index + 1);
            }));
        }
        load(name) {
            if (this.v[name]) {
                let p = this.v[name];
                let w = [];
                fgui.UIPackage.loadPackage(p, Laya.Handler.create(this, () => {
                    console.log("load::", name);
                    mvc.send(MsgType.FGUI_COMP, [name]);
                }));
            }
        }
    }
    FguiMgr._instance = null;

    class Mvc extends Laya.EventDispatcher {
        send(type, data) {
            this.event(type, data);
        }
    }
    const mvc = new Mvc();

    class MainScene extends Scene {
        constructor() {
            super(...arguments);
            this.isStarting = false;
        }
        init(packageName, viewName) {
            super.init("Tiles", "Main");
        }
        bindChild() {
            this.btn_set = this.getButton('btn_set');
            this.btn_user = this.getButton('btn_user');
            this.btn_start = this.getButton('btn_start');
            mvc.on(MsgType.OPEN_NO_USER, this, this.openNoUser);
        }
        openNoUser() {
            ViewManager.inst.popView(NoUserPanel);
        }
        refresh() {
            this.isStarting = false;
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_set:
                    ViewManager.inst.popView(SetPanel, { hasQuit: false });
                    break;
                case this.btn_user:
                    ViewManager.inst.popView(UserPanel);
                    break;
                case this.btn_start:
                    if (this.isStarting)
                        return;
                    this.isStarting = true;
                    ViewManager.inst.popScene(GameScene);
                    break;
            }
        }
    }

    class GameScene extends Scene {
        constructor() {
            super(...arguments);
            this.tilesItem = [];
            this.flyItems = [];
            this.QueueArr = [];
            this.QueueStartPos = { x: 0, y: 0 };
            this.LogicArr = [];
            this.LogicStartPos = { x: 0, y: 0 };
            this.QueueGap = 93;
            this.Level = 1;
            this.isShared = false;
            this.status = 0;
            this.moveTimes = 10;
            this.updateInterval = null;
        }
        init(packageName, viewName) {
            super.init("Tiles", "Game");
        }
        bindChild() {
            this.empty = this.getComponent("empty");
            this.flyEmpty = this.getComponent("flyEmpty");
            this.btn_set = this.getButton("btn_set");
            this.btn_share = this.getButton("btn_share");
            this.btn_prop = this.getButton("btn_prop");
            mvc.on(MsgType.CLICK_TILES, this, this.ClickItem);
            mvc.on(MsgType.REFRESH_USER, this, this.onRefreshUi);
        }
        refresh() {
            this.isShared = false;
            this.btn_share.icon = ResMgr.GetInstance().GetIconUrl("share");
            this.initGame();
            if (this.updateInterval)
                clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                this.onUpdate();
            }, 16);
        }
        onHide() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        }
        initGame(Level = 1) {
            if (Level == 1) {
                UserMgr.GetInstance().StartGame();
            }
            this.Clear();
            this.Level = Level;
            this.mapData = MapDataController.GetInstance().StartLevel(Level);
            if (!this.mapData) {
                this.CheckGameOver();
            }
            let pos = this.getComponent('Tiles_Pos');
            let lPos = this.getComponent('Tiles_Logic');
            this.QueueStartPos = {
                x: pos.x, y: pos.y
            };
            this.LogicStartPos = {
                x: lPos.x, y: lPos.y
            };
            this.initItem();
        }
        Clear() {
            this.status = 0;
            for (let i = 0; i < this.tilesItem.length; i++) {
                this.tilesItem[i].removeFromParent();
                PoolMgr.GetInstance().Recover("Tiles.tiles_item", this.tilesItem[i]);
            }
            this.tilesItem = [];
            for (let i = 0; i < this.QueueArr.length; i++) {
                this.QueueArr[i].removeFromParent();
                PoolMgr.GetInstance().Recover("Tiles.tiles_item", this.QueueArr[i]);
            }
            this.QueueArr = [];
        }
        initItem() {
            for (let i = 0; i < this.mapData.length; i++) {
                for (let j = 0; j < this.mapData[i].length; j++) {
                    let item = PoolMgr.GetInstance().GetPoolObject("Tiles.tiles_item");
                    item.init(this.mapData[i][j]);
                    this.empty.addChild(item);
                    this.tilesItem.push(item);
                }
            }
            this.onUpdateStatus();
            this.onRefreshUi();
        }
        ClickItem(item) {
            if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
                return;
            }
            let logicIndex = this.LogicArr.indexOf(item);
            if (logicIndex > -1) {
                this.LogicArr.splice(logicIndex, 1);
            }
            MapDataController.GetInstance().MoveToCollection(item.mapData);
            this.Fly(item);
            this.onUpdateStatus();
        }
        FlyToLogic(item, pos) {
            Laya.Tween.to(item, {
                x: this.LogicStartPos.x + pos * (item.width - 2),
                y: this.LogicStartPos.y
            }, 200, null, Laya.Handler.create(this, () => {
                item.removeFromParent();
                this.empty.addChild(item);
            }));
        }
        Fly(item) {
            item.removeFromParent();
            let flyItem = item;
            let endIndex = -1;
            let posIndex = 0;
            for (let i = this.QueueArr.length - 1; i >= 0; i--) {
                let type = this.QueueArr[i].mapData.Type;
                if (type == flyItem.mapData.Type) {
                    endIndex = i + 1;
                    break;
                }
            }
            if (endIndex == -1) {
                posIndex = this.QueueArr.length;
                this.flyEmpty.addChild(flyItem);
                this.QueueArr.push(flyItem);
            }
            else {
                posIndex = endIndex;
                this.flyEmpty.addChildAt(flyItem, endIndex);
                this.QueueArr.splice(endIndex, 0, flyItem);
            }
            this.flyItems.push(flyItem);
            this.FlyItem(flyItem, posIndex);
        }
        FlyItem(flyItem, posIndex) {
            Laya.Tween.to(flyItem, {
                x: this.QueueStartPos.x + posIndex * this.QueueGap,
                y: this.QueueStartPos.y
            }, 150, null, Laya.Handler.create(this, this.FlyCompleteBack));
            setTimeout(() => {
                flyItem['$isFlyed'] = true;
            }, 150);
        }
        FlyCompleteBack() {
            let deleteItem = [];
            let deletePos = [];
            for (let i = 0; i < this.QueueArr.length - 2; i++) {
                if (this.QueueArr[i].mapData.Type == this.QueueArr[i + 1].mapData.Type
                    && this.QueueArr[i].mapData.Type == this.QueueArr[i + 2].mapData.Type
                    && this.QueueArr[i].IsClickDipose()
                    && this.QueueArr[i + 1].IsClickDipose()
                    && this.QueueArr[i + 2].IsClickDipose()) {
                    deletePos.push(i);
                    deletePos.push(i + 1);
                    deletePos.push(i + 2);
                    MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i].mapData);
                    MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i + 1].mapData);
                    MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i + 2].mapData);
                }
            }
            if (deletePos.length <= 0) {
                this.CheckGameOver();
                return;
            }
            for (let i = this.QueueArr.length - 1; i >= 0; i--) {
                if (deletePos.indexOf(i) > -1) {
                    deleteItem.push(this.QueueArr[i]);
                    this.QueueArr.splice(i, 1);
                }
            }
            for (let i = 0; i < deleteItem.length; i++) {
                this.Dispose(deleteItem[i]);
            }
            deleteItem = [];
            deletePos = [];
            this.CheckGameOver();
        }
        Dispose(item) {
            item['$isFlyed'] = false;
            Laya.Tween.to(item, { scaleX: 0, scaleY: 0 }, 200, null, Laya.Handler.create(this, () => {
                item.removeFromParent();
                PoolMgr.GetInstance().Recover("Tiles.tiles_item", item);
            }));
        }
        TweenBack(item) {
            Laya.Tween.to(item, { x: item.x + this.QueueGap }, 100);
        }
        TweenLogic(item, pos) {
            Laya.Tween.to(item, { x: this.LogicStartPos.x + pos * (item.width - 2) }, 100);
        }
        TweenItem(item, pos) {
            Laya.Tween.to(item, { x: this.QueueStartPos.x + pos * this.QueueGap }, 0.1);
        }
        CheckGameFail() {
            if (this.status != 0)
                return;
            if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
                this.status = 1;
                UserMgr.GetInstance().StopGame();
                ViewManager.inst.popView(FailPanel);
            }
        }
        CheckGameOver() {
            if (this.status != 0)
                return;
            if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
                UserMgr.GetInstance().StopGame();
                this.status = 1;
                ViewManager.inst.popView(FailPanel);
            }
            if (this.QueueArr.length > 0)
                return;
            let flag = true;
            for (let i = 0; i < this.tilesItem.length; i++) {
                if (!this.tilesItem[i].IsDispose()) {
                    flag = false;
                    break;
                }
            }
            if (!flag)
                return;
            let nextLevel = MapDataController.GetInstance().HasNextLevel(this.Level);
            if (nextLevel == 99999) {
                UserMgr.GetInstance().StopGame();
                this.status = 2;
                ViewManager.inst.popView(WinPanel);
            }
            else {
                setTimeout(() => {
                    this.initGame(nextLevel);
                }, 200);
            }
        }
        onUpdateStatus() {
            for (let i = 0; i < this.tilesItem.length; i++) {
                this.tilesItem[i].UpdateStatus();
            }
        }
        UserProp() {
            UserMgr.GetInstance().useProp();
            let flyLogicItems = [];
            let maxLen = this.QueueArr.length > 3 ? 3 : this.QueueArr.length;
            for (let i = 0; i < maxLen; i++) {
                flyLogicItems.push(this.QueueArr[i]);
            }
            this.QueueArr.splice(0, 3);
            for (let i = 0; i < flyLogicItems.length; i++) {
                flyLogicItems[i].sortOrder = this.LogicArr.length + i;
                MapDataController.GetInstance().MoveToLogic(flyLogicItems[i].mapData);
                this.LogicArr.push(flyLogicItems[i]);
                this.FlyToLogic(flyLogicItems[i], i);
            }
            flyLogicItems = [];
            this.onRefreshUi();
        }
        onRefreshItem() {
            for (let i = 0; i < this.QueueArr.length; i++) {
                this.TweenItem(this.QueueArr[i], i);
            }
        }
        onRefreshUi() {
            let userInfo = UserMgr.GetInstance().getInfo();
            this.btn_prop.title = userInfo.share_item > 0 ? `x${userInfo.share_item}` : "";
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_set:
                    ViewManager.inst.popView(SetPanel, { hasQuit: true });
                    break;
                case this.btn_share:
                    if (this.isShared)
                        return;
                    this.isShared = true;
                    this.btn_share.icon = ResMgr.GetInstance().GetIconUrl("shared");
                    break;
                case this.btn_prop:
                    if (this.QueueArr.length <= 0)
                        return;
                    ViewManager.inst.popView(PropPanel);
                    break;
            }
        }
        onUpdate() {
            for (let i = 0; i < this.QueueArr.length; i++) {
                if (this.QueueArr[i]['$isFlyed']) {
                    let x = this.QueueStartPos.x + i * this.QueueGap;
                    if (x != this.QueueArr[i].x) {
                        let pos = x - this.QueueArr[i].x;
                        let abs = pos < 0 ? -1 : 1;
                        let move = this.moveTimes;
                        pos = Math.abs(pos);
                        if (pos < this.moveTimes) {
                            move = pos;
                        }
                        this.QueueArr[i].x += move * abs;
                    }
                }
            }
        }
    }

    class View extends Scene {
        constructor() {
            super();
        }
        onShown(...args) {
            super.onShown(...args);
            this.ShowAnimation();
        }
        init(viewName, packageName) {
            super.init(viewName, packageName);
            this.view.setPivot(0.5, 0.5, true);
            this.view.setXY(fgui.GRoot.inst.width / 2, fgui.GRoot.inst.height / 2);
        }
        ShowAnimation() {
            this.view.scaleX = this.view.scaleY = 0;
            Laya.Tween.to(this.view, {
                scaleX: 1, scaleY: 1
            }, 200, null);
        }
    }

    class WinPanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "Win");
        }
        bindChild() {
            this.btn_restart = this.getButton('btn_restart');
            this.btn_share = this.getButton('btn_share');
            this.btn_close = this.getButton('btn_close');
            this.text_todayWin = this.getTextField("times");
            this.text_useTime = this.getTextField("time");
        }
        refresh() {
            let userInfo = UserMgr.GetInstance().getInfo();
            this.text_todayWin.text = (parseInt(userInfo.daily_win || "0") + 1) + "次";
            this.text_useTime.text = UserMgr.GetInstance().ConvertToHMS();
            UserMgr.GetInstance().GameOver(true);
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_restart:
                    UserMgr.GetInstance().DoStart(() => {
                        ViewManager.inst.hideView(this);
                        ViewManager.inst.NowScene.initGame();
                    }, () => {
                    });
                    break;
                case this.btn_share:
                    ViewManager.inst.hideView(this);
                    ShareView.ShowShare(true);
                    break;
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    mvc.event(MsgType.JUMP_MAIN);
                    break;
            }
        }
    }

    class PropPanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "Prop");
        }
        bindChild() {
            this.btn_give = this.getButton('btn_give');
            this.btn_close = this.getButton('btn_close');
            this.btn_use = this.getButton('btn_use');
        }
        refresh() {
            this.btn_use.title = UserMgr.GetInstance().getInfo().share_item + "";
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_give:
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    break;
                case this.btn_use:
                    UserMgr.GetInstance().UseProp(() => {
                        ViewManager.inst.NowScene.UserProp();
                        ViewManager.inst.hideView(this);
                    }, () => {
                    });
                    break;
            }
        }
    }

    class FailPanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "Fail");
        }
        bindChild() {
            this.btn_restart = this.getButton('btn_restart');
            this.btn_share = this.getButton('btn_share');
            this.btn_close = this.getButton('btn_close');
            this.text_todayPlay = this.getTextField('time');
            this.text_todayWin = this.getTextField('times');
        }
        refresh() {
            let userInfo = UserMgr.GetInstance().getInfo();
            this.text_todayPlay.text = (parseInt(userInfo.daily_game || "0") + 1) + "次";
            this.text_todayWin.text = (parseInt(userInfo.daily_win || "0") + 1) + "次";
            UserMgr.GetInstance().GameOver(false);
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_restart:
                    UserMgr.GetInstance().DoStart(() => {
                        ViewManager.inst.hideView(this);
                        ViewManager.inst.NowScene.initGame();
                    }, () => {
                    });
                    break;
                case this.btn_share:
                    ViewManager.inst.hideView(this);
                    ShareView.ShowShare(true);
                    break;
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    mvc.event(MsgType.JUMP_MAIN);
                    break;
            }
        }
    }

    class UserPanel extends View {
        constructor() {
            super(...arguments);
            this.qrCode = null;
        }
        init(packageName, viewName) {
            super.init("Tiles", 'User');
        }
        bindChild() {
            this.btn_close = this.getButton('btn_close');
            this.comp_QrCode = this.getButton('comp_qrCode');
            this.label_icon = this.getLabel('label_icon');
            this.text_info = this.getTextField("text_info");
            this.text_nickname = this.getTextField("text_nickname");
            this.qrCode = QrCodeView.CreateQRCode(112, 112, UserMgr.GetInstance().GetShareUrl(), "https://web.sanguosha.com/10/pc/res/assets/runtime/item/80x80/780004.png");
            this.comp_QrCode.displayListContainer.addChild(this.qrCode);
        }
        refresh() {
            let userInfo = UserMgr.GetInstance().getInfo();
            this.text_info.text = `2000年09月09日诞生\n已挑战 ${userInfo.total_game}次\n已通关 ${userInfo.total_win}次`;
            this.text_nickname.text = `${userInfo.nickname}`;
            this.label_icon.icon = userInfo.avatar;
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    break;
            }
        }
    }

    class SetPanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "Set");
        }
        bindChild() {
            this.btn_close = this.getButton('btn_close');
            this.btn_give = this.getButton('btn_give');
            this.btn_music = this.getButton("btn_music");
        }
        refresh() {
            console.log(this.openData);
            if (this.openData.length > 0) {
                let args = this.openData[0];
                this.view.getController('hasQuit').selectedIndex = args.hasQuit ? 1 : 0;
            }
            this.btn_music.selected = UserMgr.GetInstance().musicSet;
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    break;
                case this.btn_give:
                    ViewManager.inst.hideView(this);
                    ViewManager.inst.popView(GiveUpPanel);
                    break;
                case this.btn_music:
                    UserMgr.GetInstance().ChangeSet(this.btn_music.selected);
                    break;
            }
        }
    }

    class GiveUpPanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "GiveUp");
        }
        bindChild() {
            this.btn_close = this.getButton("btn_close");
            this.btn_give = this.getButton("btn_give");
            this.btn_try = this.getButton("btn_try");
        }
        refresh() {
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_try:
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    break;
                case this.btn_give:
                    ViewManager.inst.hideView(this);
                    mvc.event(MsgType.JUMP_MAIN);
                    break;
            }
        }
    }

    class NoUserPanel extends View {
        init(viewName, packageName) {
            super.init("Common", "Fail");
        }
        bindChild() {
            this.btn_click = this.getButton('n1');
        }
        refresh() {
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_click:
                    UserMgr.GetInstance().GetUserInfo(() => {
                        ViewManager.inst.hideView(this);
                    }, null);
                    break;
            }
        }
    }

    class InvitePanel extends View {
        init(viewName, packageName) {
            super.init("Tiles", "Invite");
        }
        bindChild() {
            this.btn_close = this.getButton("btn_close");
        }
        refresh() {
        }
        onClickButton(btn) {
            switch (btn) {
                case this.btn_close:
                    ViewManager.inst.hideView(this);
                    break;
            }
        }
    }

    class Main {
        constructor() {
            Laya.init(750, 1300, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = "fixedwidth";
            Laya.stage.screenMode = "none";
            Laya.stage.alignV = "top";
            Laya.stage.alignH = "left";
            Laya.URL.exportSceneToJson = true;
            Laya.alertGlobalError(true);
            fgui.UIConfig.packageFileExtension = "bin";
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
            Laya.stage.addChild(fgui.GRoot.inst.displayObject);
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
            FguiMgr.getInstance().loadAll();
            Laya.loader.load(["res/config/GameConfig.json", "res/assets/shader/shader.atlas"], Laya.Handler.create(this, () => {
                let data = Laya.loader.getRes("res/config/GameConfig.json");
                MapDataController.GetInstance().ParseConfig(data);
            }));
            mvc.on(MsgType.FGUI_COMP, this, (name) => {
                if (name == "Tiles") {
                    this.setExtends();
                    UserMgr.GetInstance().init();
                    ViewManager.inst.popScene(MainScene);
                }
            });
            mvc.on(MsgType.JUMP_MAIN, this, () => {
                ViewManager.inst.popScene(MainScene);
            });
        }
        setExtends() {
            fgui.UIObjectFactory.setPackageItemExtension(fgui.UIPackage.getItemURL("Tiles", "tiles_item"), TilesItem);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
        }
    }
    new Main();

}());
