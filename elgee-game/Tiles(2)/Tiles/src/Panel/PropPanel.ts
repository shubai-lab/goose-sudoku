import UserMgr from "../control/UserMgr";
import GameScene from "../Scene/GameScene";
import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class PropPanel extends View {

    btn_close: fgui.GButton;
    btn_give: fgui.GButton;
    btn_use: fgui.GButton;

    init(viewName: any, packageName: any): void {
        super.init("Tiles", "Prop");
    }


    public bindChild(): void {
        this.btn_give = this.getButton('btn_give');
        this.btn_close = this.getButton('btn_close');
        this.btn_use = this.getButton('btn_use');
    }

    public refresh(): void {
        this.btn_use.title = UserMgr.GetInstance().getInfo().share_item + "";
    }

    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_give:
            case this.btn_close:
                ViewManager.inst.hideView(this);
                break;
            case this.btn_use:
                UserMgr.GetInstance().UseProp(() => {
                    (ViewManager.inst.NowScene as GameScene).UserProp();
                    ViewManager.inst.hideView(this);
                }, () => {

                });
                // let userInfo = UserMgr.GetInstance().getInfo();
                // if (userInfo.share_item > 0) {

                // }
                break;
        }
    }
}