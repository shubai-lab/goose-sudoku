export default class QrCodeView extends Laya.Sprite {
    constructor() {
        super();
        this.logoUrl = "";
        this.qrcodeLoaded = false;
        this.logoLoaded = false;
        this.qrImage = new Laya.Image();
        this.addChild(this.qrImage);
        this.logoImage = new Laya.Image();
        this.addChild(this.logoImage);
    }
    static CreateQRCode(width, height, text, logoUrl = "", logoWidth = 0, logoHeight = 0) {
        let qrView = new QrCodeView();
        qrView.UpdateQRCode(width, height, text, logoUrl, logoWidth, logoHeight);
        return qrView;
    }
    UpdateQRCode(width, height, text, logoUrl = "", logoWidth = 0, logoHeight = 0) {
        if (!Laya.Browser.window.QRCode) {
            this.checkLoadEnd();
            return;
        }
        this.qrImage.skin = this.logoImage.skin = null;
        this.qrImage.source = this.logoImage.source = null;
        this.qrImage.visible = this.logoImage.visible = false;
        this.qrcodeLoaded = false;
        this.logoLoaded = false;
        this.size(width, height);
        this.updateQRCode(text, width, height);
        this.updateLogo(logoUrl, logoWidth, logoHeight);
    }
    updateQRCode(text, width, height) {
        if (this.qrcode) {
            this.qrcode.clear();
            if (this.qrcode["_htOption"].width != width || this.qrcode["_htOption"].height != height)
                this.qrcode = null;
        }
        if (!this.qrcode) {
            if (!this.qrcodeDiv)
                this.qrcodeDiv = Laya.Browser.document.createElement("div");
            this.qrcode = new Laya.Browser.window.QRCode(this.qrcodeDiv, { width: width, height: height });
        }
        this.qrcode.makeCode(text);
        let self = this;
        Laya.timer.once(1000, this, function () {
            if (self.destroyed)
                return;
            self.qrcodeLoaded = true;
            self.qrImage.skin = self.qrcode._oDrawing._elImage.src;
            self.checkLoadEnd();
        });
    }
    updateLogo(logoUrl = "", logoWidth = 0, logoHeight = 0) {
        this.logoUrl = logoUrl;
        if (!logoUrl) {
            this.checkLoadEnd();
            return;
        }
        if (logoWidth)
            this.logoImage.width = logoWidth;
        if (logoHeight)
            this.logoImage.height = logoHeight;
        let self = this;
        let logoTexture = Laya.loader.getRes(logoUrl);
        if (logoTexture) {
            self.logoLoaded = true;
            self.logoImage.source = logoTexture;
            self.logoImage.pos(self.width - self.logoImage.width >> 1, self.height - self.logoImage.height >> 1);
            self.checkLoadEnd();
        }
        else {
            Laya.loader.load(logoUrl, Laya.Handler.create(this, function (url, data) {
                if (self.destroyed)
                    return;
                if (self.logoUrl != url)
                    return;
                self.logoLoaded = true;
                if (!data) { }
                else {
                    self.logoImage.source = data;
                    self.logoImage.pos(self.width - self.logoImage.width >> 1, self.height - self.logoImage.height >> 1);
                }
                self.checkLoadEnd();
            }, [logoUrl]), null, "image");
        }
    }
    checkLoadEnd() {
        if (!Laya.Browser.window.QRCode) {
            this.event(Laya.Event.ERROR, this);
        }
        else {
            if (this.logoUrl) {
                if (this.qrcodeLoaded && this.logoLoaded) {
                    this.qrImage.visible = this.logoImage.visible = true;
                    this.event(Laya.Event.LOADED, this);
                }
            }
            else if (this.qrcodeLoaded) {
                this.qrImage.visible = this.logoImage.visible = true;
                this.event(Laya.Event.LOADED, this);
            }
        }
    }
}
//# sourceMappingURL=QrCodeView.js.map