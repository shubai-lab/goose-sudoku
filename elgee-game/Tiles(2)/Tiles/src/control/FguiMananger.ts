import { mvc } from "./mvc";

export enum MsgType {
    FGUI_COMP = "FGUI_COMP",
    FGUI_LOADING = "FGUI_LOADING",
    REFRESH_USER = "REFRESH_USER",
    SHOW_SCORE = 'SHOW_SCORE',
    REFRESH_GAME = "REFRESH_GAME",
    ADD_PROGERSS = "ADD_PROGERSS",
    FLY_BY_PROGRESS = "FLY_BY_PROGRESS",
    CLICK_TILES = "CLICK_TILES",
    OPEN_NO_USER = "OPEN_NO_USER",
    JUMP_MAIN = "JUMP_MAIN"
}

export class FguiMgr {
    static _instance = null;
    static getInstance(): FguiMgr {
        if (this._instance == null) {
            this._instance = new FguiMgr();
        }
        return this._instance;
    }

    public v: Map<string, string> = null;
    constructor() {
        this.v = new Map();
        this.v["Common"] = "res/fgui/Common";
        this.v["Tiles"] = "res/fgui/Tiles";
    }

    public loadAll() {
        let key = [
            'Common',
            'Tiles'
        ];
        this.StartLoad(key, 0);
        // let keys = Object.keys(this.v);
        // let index = 0;
        // while (index < keys.length) {
        //     let p = this.v[keys[index]];
        //     fgui.UIPackage.loadPackage(p, Laya.Handler.create(this, () => {
        //         console.log("load::", name);
        //         index++;
        //         mvc.send(MsgType.FGUI_COMP, [name]);
        //     }));
        // }
    }

    public StartLoad(keys, index) {
        if (index >= keys.length) return;
        let name = keys[index];
        let p = this.v[name];
        fgui.UIPackage.loadPackage(p, Laya.Handler.create(this, () => {
            console.log("load::", name);
            mvc.send(MsgType.FGUI_COMP, [name]);
            this.StartLoad(keys, index + 1);
        }));
    }

    public load(name: string) {
        if (this.v[name]) {
            let p = this.v[name];
            let w = [];
            fgui.UIPackage.loadPackage(p, Laya.Handler.create(this, () => {
                console.log("load::", name);
                mvc.send(MsgType.FGUI_COMP, [name]);
            }));
            // for (let i = 0; i < p.length; i++) {
            //     w.push({ url: p[i].name, type: p[i].ext == "bin" ? Laya.Loader.BUFFER : Laya.Loader.IMAGE });
            // }
            // Laya.loader.load(w, Laya.Handler.create(this, () => {

            // }))
        }
    }
}