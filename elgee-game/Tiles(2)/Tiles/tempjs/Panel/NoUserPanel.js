import UserMgr from "../control/UserMgr";
import View from "../view/View";
import ViewManager from "../view/ViewManager";
export default class NoUserPanel extends View {
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
//# sourceMappingURL=NoUserPanel.js.map