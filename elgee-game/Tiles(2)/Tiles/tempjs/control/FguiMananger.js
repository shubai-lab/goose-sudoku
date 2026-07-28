import { mvc } from "./mvc";
export var MsgType;
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
export class FguiMgr {
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
//# sourceMappingURL=FguiMananger.js.map