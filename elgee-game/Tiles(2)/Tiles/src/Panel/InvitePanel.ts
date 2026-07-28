import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class InvitePanel extends View {

    btn_close: fgui.GButton;

    init(viewName: any, packageName: any): void {
        super.init("Tiles", "Invite");
    }

    public bindChild(): void {
        this.btn_close = this.getButton("btn_close");
    }


    public refresh(): void {

    }

    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_close:
                ViewManager.inst.hideView(this);
                break;
        }
    }
}