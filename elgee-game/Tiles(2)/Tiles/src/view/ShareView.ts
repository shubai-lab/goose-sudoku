import { MsgType } from "../control/FguiMananger";
import { mvc } from "../control/mvc";
import UserMgr from "../control/UserMgr";
import QrCodeView from "./QrCodeView";

export default class ShareView extends Laya.Sprite
{
    private maskSp:Laya.Sprite;
    private contentSp:Laya.Sprite;
    private contentBg:Laya.Image;
    private headImage:Laya.Image;
    private nameText:Laya.Text;
    private battleCountText:Laya.Text;
    private passCountText:Laya.Text;
    private qrCodeView:QrCodeView;

    private closeBtn:Laya.Image;
    private tipImage:Laya.Image;

    private reference:Laya.Sprite;
    private imgElement:any;

    private headLoaded:boolean = false;
    private isJumpMain:boolean = false;

    constructor(isJumpMain:boolean = false)
    {
        super();

        this.isJumpMain = isJumpMain;
        this.initChilds();
        this.onStageResize();
        Laya.stage.on(Laya.Event.RESIZE,this,this.onStageResize);
    }

    public static ShowShare(isJumpMain:boolean = false):void
    {
        let shaderView = new ShareView(isJumpMain);
        shaderView.zOrder = Number.MAX_VALUE;
        Laya.stage.addChild(shaderView);
    }

    //预先创建分享二维码
    public static QRCodeView:QrCodeView;
    public static PreLoadShare():void
    {
        // if (ShareView.QRCodeView) return;
        let userMgr = UserMgr.GetInstance();
        let userInfo = userMgr.getInfo();
        ShareView.QRCodeView = QrCodeView.CreateQRCode(121-6,121-6,userMgr.GameUrl + "?invitecode=" + userInfo.invite_code,"shader/logoIcon.jpg",35,35);
        Laya.loader.load(userInfo.avatar,null,null,"image");
    }

    private initChilds():void
    {
        let userInfo = UserMgr.GetInstance().getInfo();
        if (!userInfo)
        {
            if (this.isJumpMain)
                mvc.event(MsgType.JUMP_MAIN);
            this.destroy();
            return;
        }

        this.maskSp = new Laya.Sprite();
        this.maskSp.alpha = 0.5;
        this.maskSp.on(Laya.Event.CLICK,this,this.onStageClick);
        this.addChild(this.maskSp);

        this.reference = new Laya.Sprite();
        this.reference.size(453,784);
        this.addChild(this.reference);

        this.contentSp = new Laya.Sprite();
        // this.addChild(this.contentSp);

        this.contentBg = new Laya.Image();
        this.contentBg.source = Laya.loader.getRes("shader/shaderBg.png");
        this.contentSp.addChild(this.contentBg);

        this.headImage = new Laya.Image();
        this.headImage.pos(72,1166);
        this.headImage.size(84,84);
        this.contentSp.addChild(this.headImage);

        this.nameText = new Laya.Text();
        this.nameText.pos(183,1166+32);
        this.nameText.color = "#FFFFFF";
        this.nameText.fontSize = 24;
        this.nameText.text = userInfo.nickname;
        this.contentSp.addChild(this.nameText);

        this.battleCountText = new Laya.Text();
        this.battleCountText.pos(183,1166+64);
        this.battleCountText.color = "#FFFFFF";
        this.battleCountText.fontSize = 24;
        this.battleCountText.text = "已挑战 " + userInfo.total_game + "次";
        this.contentSp.addChild(this.battleCountText);

        this.passCountText = new Laya.Text();
        this.passCountText.pos(183,1166);
        this.passCountText.color = "#FFFFFF";
        this.passCountText.fontSize = 24;
        this.passCountText.text = "已通关 " + userInfo.total_win + "次";
        this.contentSp.addChild(this.passCountText);

        this.qrCodeView = ShareView.QRCodeView;
        this.qrCodeView.pos(534+3,1039+3);
        this.contentSp.addChild(this.qrCodeView);

        this.closeBtn = new Laya.Image();
        this.closeBtn.source = Laya.loader.getRes("shader/shaderClose.png");
        this.closeBtn.visible = false;
        this.closeBtn.on(Laya.Event.CLICK,this,this.onCloseHandler);
        this.addChild(this.closeBtn);

        this.tipImage = new Laya.Image();
        this.tipImage.source = Laya.loader.getRes("shader/shaderText.png");
        this.tipImage.visible = false;
        this.addChild(this.tipImage);

        //加载头像
        let self = this;
        Laya.loader.load(userInfo.avatar,Laya.Handler.create(this,function(url:string,data:any) {
            if (self.destroyed) return;
            self.headImage.source = data;
            self.headLoaded = true;
            Laya.timer.once(50,self,self.onMergeImg);
        },[userInfo.avatar]),null,"image");
    }

    private onMergeImg():void
    {
        var htmlC:Laya.HTMLCanvas = this.contentSp.drawToCanvas(750,1300,0,0);
        var base64:string = htmlC.toBase64("image/png",1);
        
        htmlC.destroy();
        if (this.qrCodeView)
        {
            this.qrCodeView.removeSelf();
            this.qrCodeView = null;
        }
        if (this.contentSp)
        {
            this.contentSp.destroy();
            this.contentSp = null;
        }

        this.imgElement = document.getElementById("mergeImg");
        if (this.imgElement)
            this.imgElement.style.display = "block";
        else
        {
            this.imgElement = document.createElement("img");
            this.imgElement.id = "mergeImg";
            this.imgElement.crossOrigin = "";
            document.getElementById("layaContainer").appendChild(this.imgElement);
        }
        this.imgElement.src = base64;
        Laya.Utils.fitDOMElementInArea(this.imgElement,this.reference,0,0,this.reference.width,this.reference.height);

        this.closeBtn.visible = this.tipImage.visible = true;
    }

    private onStageClick(event:Laya.Event):void
    {
    }

    private onStageResize():void
    {
        this.size(Laya.stage.width,Laya.stage.height);

        this.maskSp.graphics.clear();
        this.maskSp.size(this.width,this.height);
        this.maskSp.graphics.drawRect(0,0,this.width,this.height,"#000000");
        
        this.reference.pos(this.width - this.reference.width >> 1,this.height - (this.reference.height + 184) >> 1);
        this.closeBtn.pos(625,this.reference.y - 67);
        this.tipImage.pos(109,this.reference.y + this.reference.height + 39);

        if (this.imgElement)
            Laya.Utils.fitDOMElementInArea(this.imgElement,this.reference,0,0,this.reference.width,this.reference.height);
    }

    private onCloseHandler():void
    {
        if (this.isJumpMain)
            mvc.event(MsgType.JUMP_MAIN);
        this.destroy();
    }

    public destroy(): void 
    {
        Laya.timer.clearAll(this);
        if (this.qrCodeView)
        {
            this.qrCodeView.removeSelf();
            this.qrCodeView = null;
        }
        if (this.contentSp)
        {
            this.contentSp.destroy();
            this.contentSp = null;
        }
        if (this.imgElement)
        {
            this.imgElement.src = "";
            this.imgElement.style.display = "none";
            this.imgElement = null;
        }
        super.destroy();
    }

}