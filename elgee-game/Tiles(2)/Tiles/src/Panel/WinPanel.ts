import { MsgType } from "../control/FguiMananger";
import { mvc } from "../control/mvc";
import UserMgr from "../control/UserMgr";
import GameScene from "../Scene/GameScene";
import ShareView from "../view/ShareView";
import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class WinPanel extends View {

    btn_restart: fgui.GButton;
    btn_share: fgui.GButton;
    btn_close: fgui.GButton;

    text_todayWin: fgui.GTextField;
    text_useTime: fgui.GTextField;

    init(viewName: any, packageName: any): void {
        super.init("Tiles", "Win");
    }


    public bindChild(): void {
        this.btn_restart = this.getButton('btn_restart');
        this.btn_share = this.getButton('btn_share');
        this.btn_close = this.getButton('btn_close');

        this.text_todayWin = this.getTextField("times");
        this.text_useTime = this.getTextField("time");
    }

    public refresh(): void {
        let userInfo = UserMgr.GetInstance().getInfo();
        this.text_todayWin.text = (parseInt(userInfo.daily_win || "0") + 1) + "次";
        this.text_useTime.text = UserMgr.GetInstance().ConvertToHMS();
        UserMgr.GetInstance().GameOver(true);
    }

    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_restart:
                UserMgr.GetInstance().DoStart(() => {
                    ViewManager.inst.hideView(this);
                    (ViewManager.inst.NowScene as GameScene).initGame();
                }, () => {

                })
                break;
            case this.btn_share:
                ViewManager.inst.hideView(this);
                ShareView.ShowShare(true);
                break;
            case this.btn_close:
                ViewManager.inst.hideView(this);
                mvc.event(MsgType.JUMP_MAIN);
                break;
        }
    }
}