import UserMgr from "../control/UserMgr";
import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class NoUserPanel extends View {

    btn_click: fgui.GButton;

    init(viewName: any, packageName: any): void {
        super.init("Common", "Fail");
    }

    public bindChild(): void {
        this.btn_click = this.getButton('n1');
    }

    public refresh(): void {

    }

    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_click:
                UserMgr.GetInstance().GetUserInfo(() => {
                    ViewManager.inst.hideView(this);
                }, null);
                break;
        }
    }
}