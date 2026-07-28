import { MsgType } from "../control/FguiMananger";
import { mvc } from "../control/mvc";
import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class GiveUpPanel extends View {

    btn_close: fgui.GButton;
    btn_give: fgui.GButton;
    btn_try: fgui.GButton;


    init(viewName: any, packageName: any): void {
        super.init("Tiles", "GiveUp");
    }


    public bindChild(): void {
        this.btn_close = this.getButton("btn_close");
        this.btn_give = this.getButton("btn_give");
        this.btn_try = this.getButton("btn_try");
    }

    public refresh(): void {

    }

    public onClickButton(btn: fairygui.GButton): void {
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