import { MsgType } from "../control/FguiMananger";
import { mvc } from "../control/mvc";
import NoUserPanel from "../Panel/NoUserPanel";
import SetPanel from "../Panel/SetPanel";
import UserPanel from "../Panel/UserPanel";
import Scene from "../view/Scene";
import ViewManager from "../view/ViewManager";
import GameScene from "./GameScene";
export default class MainScene extends Scene {
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
//# sourceMappingURL=MainScene.js.map