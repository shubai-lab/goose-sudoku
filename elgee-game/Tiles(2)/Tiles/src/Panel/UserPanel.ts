import UserMgr from "../control/UserMgr";
import QrCodeView from "../view/QrCodeView";
import View from "../view/View";
import ViewManager from "../view/ViewManager";

export default class UserPanel extends View {

    btn_close: fgui.GButton;
    comp_QrCode: fgui.GComponent;
    label_icon: fgui.GLabel;

    text_info: fgui.GTextField;
    text_nickname: fgui.GTextField;

    qrCode = null;

    init(packageName: any, viewName: any): void {
        super.init("Tiles", 'User');
    }


    public bindChild(): void {
        this.btn_close = this.getButton('btn_close');
        this.comp_QrCode = this.getButton('comp_qrCode');

        this.label_icon = this.getLabel('label_icon');

        this.text_info = this.getTextField("text_info");
        this.text_nickname = this.getTextField("text_nickname");


        this.qrCode = QrCodeView.CreateQRCode(112, 112, UserMgr.GetInstance().GetShareUrl(), "https://web.sanguosha.com/10/pc/res/assets/runtime/item/80x80/780004.png");
        this.comp_QrCode.displayListContainer.addChild(this.qrCode);
    }

    public refresh(): void {
        let userInfo = UserMgr.GetInstance().getInfo();
        this.text_info.text = `2000年09月09日诞生\n已挑战 ${userInfo.total_game}次\n已通关 ${userInfo.total_win}次`;
        this.text_nickname.text = `${userInfo.nickname}`;
        this.label_icon.icon = userInfo.avatar;


        // let offset = this.getComponent('n0');

        // setTimeout(() => {
        //     let htmlCanvas = fgui.GRoot.inst.displayListContainer.drawToCanvas(offset.width, offset.height, - offset.x, - offset.y);
        //     let str = htmlCanvas.toBase64("image/png", 0);
        //     console.log(str);
        // }, 400);
    }


    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_close:
                ViewManager.inst.hideView(this);
                break;
        }
    }
}