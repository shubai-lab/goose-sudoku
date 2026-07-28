import UserMgr from "../control/UserMgr";
import View from "../view/View";
import ViewManager from "../view/ViewManager";
export default class PropPanel extends View {
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
//# sourceMappingURL=PropPanel.js.map