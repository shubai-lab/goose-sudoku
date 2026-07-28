import InvitePanel from "../Panel/InvitePanel";
import ShareView from "../view/ShareView";
import ViewManager from "../view/ViewManager";
import { MsgType } from "./FguiMananger";
import HttpUtils from "./HttpUtils";
import { mvc } from "./mvc";
export var Error_Code;
(function (Error_Code) {
    Error_Code[Error_Code["TOKEN_INVALID"] = 401] = "TOKEN_INVALID";
})(Error_Code || (Error_Code = {}));
;
export default class UserMgr {
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
//# sourceMappingURL=UserMgr.js.map