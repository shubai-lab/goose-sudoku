import UserMgr from "../control/UserMgr";
import View from "../view/View";
import ViewManager from "../view/ViewManager";
import GiveUpPanel from "./GiveUpPanel";
export default class SetPanel extends View {
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
//# sourceMappingURL=SetPanel.js.map