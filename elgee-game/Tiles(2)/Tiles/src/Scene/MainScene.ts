import { MsgType } from "../control/FguiMananger";
import MapDataController from "../control/mapDataController/MapDataController";
import { mvc } from "../control/mvc";
import UserMgr from "../control/UserMgr";
import NoUserPanel from "../Panel/NoUserPanel";
import SetPanel from "../Panel/SetPanel";
import UserPanel from "../Panel/UserPanel";
import Scene from "../view/Scene";
import ViewManager from "../view/ViewManager";
import GameScene from "./GameScene";

export default class MainScene extends Scene {

    private btn_set: fgui.GButton;
    private btn_user: fgui.GButton;
    private btn_start: fgui.GButton;
    isStarting = false;


    init(packageName: any, viewName: any): void {
        super.init("Tiles", "Main");
    }

    public bindChild(): void {
        this.btn_set = this.getButton('btn_set');
        this.btn_user = this.getButton('btn_user');
        this.btn_start = this.getButton('btn_start');
        mvc.on(MsgType.OPEN_NO_USER, this, this.openNoUser);
    }

    openNoUser() {
        ViewManager.inst.popView(NoUserPanel);
    }

    public refresh(): void {
        this.isStarting = false;
    }


    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_set:
                ViewManager.inst.popView(SetPanel, { hasQuit: false });
                break;
            case this.btn_user:
                ViewManager.inst.popView(UserPanel);
                break;
            case this.btn_start:
                if (this.isStarting) return;
                this.isStarting = true;
                // UserMgr.GetInstance().DoStart(() => {
                //     this.isStarting = false;
                //     ViewManager.inst.popScene(GameScene);
                // }, () => {
                //     this.isStarting = false;
                // })

                ViewManager.inst.popScene(GameScene);
                break;
        }
    }
}