import View from "../view/View";
import ViewManager from "../view/ViewManager";
export default class InvitePanel extends View {
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
//# sourceMappingURL=InvitePanel.js.map