//二维码组件
export default class QrCodeView extends Laya.Sprite
{
    private qrcodeDiv:any;
    private qrcode:any;
    private qrImage:Laya.Image;
    private logoImage:Laya.Image;

    private logoUrl:string = "";
    private qrcodeLoaded:boolean = false;
    private logoLoaded:boolean = false;

    constructor() 
    {
        super();

        this.qrImage = new Laya.Image();
        this.addChild(this.qrImage);

        this.logoImage = new Laya.Image();
        this.addChild(this.logoImage);
    }   

    /**
     * 创建返回二维码组件
     * @param width 二维码组件宽度
     * @param height 二维码组件高度
     * @param text 二维码内容字符串
     * @param logoUrl 二维码上面的logo图标地址
     * @param logoWidth logo图标宽度
     * @param logoHeight logo图标高度
     */
    public static CreateQRCode(width:number,height:number,text:string,logoUrl:string = "",logoWidth:number = 0,logoHeight:number = 0):QrCodeView
    {
        let qrView = new QrCodeView();
        qrView.UpdateQRCode(width,height,text,logoUrl,logoWidth,logoHeight);
        return qrView;
    }

    public UpdateQRCode(width:number,height:number,text:string,logoUrl:string = "",logoWidth:number = 0,logoHeight:number = 0):void
    {
        if (!Laya.Browser.window.QRCode)//没有二维码库
        {
            this.checkLoadEnd();
            return;
        }
            
        this.qrImage.skin = this.logoImage.skin = null;
        this.qrImage.source = this.logoImage.source = null;
        this.qrImage.visible = this.logoImage.visible = false;
        this.qrcodeLoaded = false;
        this.logoLoaded = false;

        this.size(width,height);
        this.updateQRCode(text,width,height);
        this.updateLogo(logoUrl,logoWidth,logoHeight);
    }

    private updateQRCode(text:string,width:number,height:number):void//更新二维码
	{
        if (this.qrcode)
        {
            this.qrcode.clear(); //清除代码
            if (this.qrcode["_htOption"].width != width || this.qrcode["_htOption"].height != height)//参数不一样需要重新创建qrcode
                this.qrcode = null;
        }
        if (!this.qrcode)
        {
            if (!this.qrcodeDiv)
                this.qrcodeDiv = Laya.Browser.document.createElement("div");
            this.qrcode = new Laya.Browser.window.QRCode(this.qrcodeDiv, {width: width,height: height});
        }
		this.qrcode.makeCode(text);
		
        let self = this;
		Laya.timer.once(1000,this,function(){//这里是异步的,延时获取
            if (self.destroyed) return;
            self.qrcodeLoaded = true;
            self.qrImage.skin = self.qrcode._oDrawing._elImage.src;
            self.checkLoadEnd();
		});
	}

    private updateLogo(logoUrl:string = "",logoWidth:number = 0,logoHeight:number = 0):void//更新logo
    {
        this.logoUrl = logoUrl;
        if (!logoUrl)//不需要logo 
        {
            this.checkLoadEnd();
            return;
        }
        if (logoWidth)
            this.logoImage.width = logoWidth;
        if (logoHeight)
            this.logoImage.height = logoHeight;

        let self = this;
        let logoTexture = Laya.loader.getRes(logoUrl);
        if (logoTexture)
        {
            self.logoLoaded = true;
            self.logoImage.source = logoTexture;
            self.logoImage.pos(self.width - self.logoImage.width >> 1,self.height - self.logoImage.height >> 1);
            self.checkLoadEnd();
        }
        else
        {
            Laya.loader.load(logoUrl,Laya.Handler.create(this,function(url:string,data:any) {
                if (self.destroyed) return;
                if (self.logoUrl != url) return;
                self.logoLoaded = true;
                if (!data)//加载失败
                {}
                else
                {
                    self.logoImage.source = data;
                    self.logoImage.pos(self.width - self.logoImage.width >> 1,self.height - self.logoImage.height >> 1);
                }
                self.checkLoadEnd();
            },[logoUrl]),null,"image");
        }
    }

    private checkLoadEnd():void
    {
        if (!Laya.Browser.window.QRCode)//没有二维码库
        {
            this.event(Laya.Event.ERROR,this);
        }
        else
        {
            if (this.logoUrl)//需要logo
            {
                if (this.qrcodeLoaded && this.logoLoaded)
                {
                    this.qrImage.visible = this.logoImage.visible = true;
                    this.event(Laya.Event.LOADED,this);  
                }
            }
            else if (this.qrcodeLoaded)
            {
                this.qrImage.visible = this.logoImage.visible = true;
                this.event(Laya.Event.LOADED,this);    
            }
        }
    }
}