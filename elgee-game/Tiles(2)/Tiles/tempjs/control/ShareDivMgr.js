export default class ShareDivMgr {
    static GetInstance() {
        if (!this._instance) {
            this._instance = new ShareDivMgr();
        }
        return this._instance;
    }
    ShowShare(contentSp, closeSp) {
        if (!this.contentReference) {
            this.contentReference = new Laya.Sprite();
        }
        this.contentReference.pos(contentSp.x, contentSp.y);
        this.contentReference.size(contentSp.width, contentSp.height);
        Laya.stage.addChild(this.contentReference);
        contentSp.pos(0, 0);
        if (!this.closeReference) {
            this.closeReference = new Laya.Sprite();
        }
        this.closeReference.pos(closeSp.x, closeSp.y);
        this.closeReference.size(closeSp.width, closeSp.height);
        Laya.stage.addChild(this.closeReference);
        closeSp.pos(0, 0);
        var htmlC = contentSp.drawToCanvas(contentSp.width, contentSp.height, 0, 0);
        var contentBase64 = htmlC.toBase64("image/png", 1);
        htmlC.destroy();
        var htmlC = closeSp.drawToCanvas(closeSp.width, closeSp.height, 0, 0);
        var closeBase64 = htmlC.toBase64("image/png", 1);
        htmlC.destroy();
        this.contentElement = document.getElementById("shareImage");
        if (this.contentElement)
            this.contentElement.style.display = "block";
        else {
            this.contentElement = document.createElement("img");
            this.contentElement.id = "shareImage";
            this.contentElement.crossOrigin = "";
            document.getElementById("layaContainer").appendChild(this.contentElement);
        }
        this.contentElement.src = contentBase64;
        this.closeElement = document.getElementById("shareClose");
        if (this.closeElement)
            this.closeElement.style.display = "block";
        else {
            this.closeElement = document.createElement("button");
            this.closeElement.id = "shareClose";
            this.closeElement.crossOrigin = "";
            document.getElementById("layaContainer").appendChild(this.closeElement);
        }
        this.closeElement.src = closeBase64;
        let self = this;
        this.closeElement.onclick = function () {
            Laya.stage.off(Laya.Event.RESIZE, this, this.onStageResize);
            self.contentReference.removeSelf();
            self.closeReference.removeSelf();
            self.contentElement.style.display = "block";
            self.closeElement.style.display = "block";
        };
        this.fitDOMElementInArea();
        Laya.stage.on(Laya.Event.RESIZE, this, this.onStageResize);
    }
    onStageResize() {
        if (this.contentReference && this.contentReference.parent) {
            this.fitDOMElementInArea();
        }
    }
    fitDOMElementInArea() {
        Laya.Utils.fitDOMElementInArea(this.contentElement, this.contentReference, 0, 0, this.contentReference.width, this.contentReference.height);
        Laya.Utils.fitDOMElementInArea(this.closeElement, this.contentReference, 0, 0, this.closeReference.width, this.closeReference.height);
    }
}
ShareDivMgr._instance = null;
//# sourceMappingURL=ShareDivMgr.js.map