import { MsgType } from "../control/FguiMananger";
import { mvc } from "../control/mvc";
import View from "../view/View";
import ViewManager from "../view/ViewManager";
export default class GiveUpPanel extends View {
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
//# sourceMappingURL=GiveUpPanel.js.map