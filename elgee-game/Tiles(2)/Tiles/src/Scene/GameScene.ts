import { MsgType } from "../control/FguiMananger";
import MapDataController from "../control/mapDataController/MapDataController";
import ShapeGridVO from "../control/mapDataController/ShapeGridVO";
import { mvc } from "../control/mvc";
import PoolMgr from "../control/PoolMgr";
import ResMgr from "../control/ResMgr";
import UserMgr, { UserInfo } from "../control/UserMgr";
import TilesItem from "../Item/TilesItem";
import FailPanel from "../Panel/FailPanel";
import PropPanel from "../Panel/PropPanel";
import SetPanel from "../Panel/SetPanel";
import WinPanel from "../Panel/WinPanel";
import Scene from "../view/Scene";
import ViewManager from "../view/ViewManager";

export default class GameScene extends Scene {

    private tilesItem: TilesItem[] = [];
    private flyItems: TilesItem[] = [];

    private empty: fgui.GComponent;
    private flyEmpty: fgui.GComponent;

    private btn_set: fgui.GButton;
    private btn_share: fgui.GButton;
    private btn_prop: fgui.GButton;

    private mapData: Array<Array<ShapeGridVO>>;

    private QueueArr: TilesItem[] = [];
    private QueueStartPos = { x: 0, y: 0 };

    private LogicArr: TilesItem[] = [];
    private LogicStartPos = { x: 0, y: 0 };

    private QueueGap = 93;
    private Level: number = 1;
    private isShared = false;
    //进行中 0  胜利1 失败2
    private status = 0;

    private moveTimes = 10;

    private updateInterval = null;

    init(packageName: any, viewName: any): void {
        super.init("Tiles", "Game");
    }

    public bindChild(): void {
        this.empty = this.getComponent("empty");
        this.flyEmpty = this.getComponent("flyEmpty");

        this.btn_set = this.getButton("btn_set");
        this.btn_share = this.getButton("btn_share");
        this.btn_prop = this.getButton("btn_prop");
        mvc.on(MsgType.CLICK_TILES, this, this.ClickItem);
        mvc.on(MsgType.REFRESH_USER, this, this.onRefreshUi);
    }

    public refresh(): void {
        this.isShared = false;
        this.btn_share.icon = ResMgr.GetInstance().GetIconUrl("share");
        this.initGame();
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            this.onUpdate();
        }, 16);
    }

    public onHide(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    initGame(Level = 1) {
        if (Level == 1) {
            UserMgr.GetInstance().StartGame();
        }
        this.Clear();
        this.Level = Level;
        this.mapData = MapDataController.GetInstance().StartLevel(Level);
        if (!this.mapData) { //如果没有地图数据，直接弹出胜利界面
            this.CheckGameOver();
        }
        let pos = this.getComponent('Tiles_Pos');
        let lPos = this.getComponent('Tiles_Logic');
        this.QueueStartPos = {
            x: pos.x, y: pos.y
        };

        this.LogicStartPos = {
            x: lPos.x, y: lPos.y
        }

        this.initItem();
    }


    Clear() {
        this.status = 0;
        for (let i = 0; i < this.tilesItem.length; i++) {
            this.tilesItem[i].removeFromParent();
            PoolMgr.GetInstance().Recover("Tiles.tiles_item", this.tilesItem[i]);
        }

        this.tilesItem = [];

        for (let i = 0; i < this.QueueArr.length; i++) {
            this.QueueArr[i].removeFromParent();
            PoolMgr.GetInstance().Recover("Tiles.tiles_item", this.QueueArr[i]);
        }

        this.QueueArr = [];
    }


    initItem() {
        for (let i = 0; i < this.mapData.length; i++) {
            for (let j = 0; j < this.mapData[i].length; j++) {
                let item = PoolMgr.GetInstance().GetPoolObject("Tiles.tiles_item") as TilesItem;
                item.init(this.mapData[i][j]);
                this.empty.addChild(item);
                this.tilesItem.push(item);
            }
        }

        this.onUpdateStatus();
        this.onRefreshUi();
    }

    ClickItem(item) {
        if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
            return;
        }
        let logicIndex = this.LogicArr.indexOf(item);
        if (logicIndex > -1) {
            this.LogicArr.splice(logicIndex, 1);
        }
        MapDataController.GetInstance().MoveToCollection(item.mapData);
        this.Fly(item);
        this.onUpdateStatus();
    }

    FlyToLogic(item, pos) {
        Laya.Tween.to(item,
            {
                x: this.LogicStartPos.x + pos * (item.width - 2),
                y: this.LogicStartPos.y
            }, 200, null, Laya.Handler.create(this, () => {
                item.removeFromParent();
                this.empty.addChild(item);
            }));
    }


    Fly(item: TilesItem) {
        //item.visible = false;
        //let flyItem = PoolMgr.GetInstance().GetPoolObject("Tiles.tiles_item") as TilesItem;
        //flyItem.init(item.mapData);
        item.removeFromParent();
        let flyItem = item;

        let endIndex = -1;
        let posIndex = 0;
        for (let i = this.QueueArr.length - 1; i >= 0; i--) {
            let type = this.QueueArr[i].mapData.Type;
            if (type == flyItem.mapData.Type) {
                endIndex = i + 1;
                break;
            }
        }

        if (endIndex == -1) {
            posIndex = this.QueueArr.length;
            this.flyEmpty.addChild(flyItem);
            this.QueueArr.push(flyItem);
        } else {
            posIndex = endIndex;
            this.flyEmpty.addChildAt(flyItem, endIndex);
            // for (let i = this.QueueArr.length - 1; i >= posIndex; i--) {
            //     this.TweenBack(this.QueueArr[i]);
            //     // this.TweenItem(this.QueueArr[i], i + 1);
            // }
            this.QueueArr.splice(endIndex, 0, flyItem);
        }

        this.flyItems.push(flyItem);
        this.FlyItem(flyItem, posIndex);

    }

    FlyItem(flyItem: TilesItem, posIndex) {
        Laya.Tween.to(flyItem,
            {
                x: this.QueueStartPos.x + posIndex * this.QueueGap,
                y: this.QueueStartPos.y
            }, 150, null, Laya.Handler.create(this, this.FlyCompleteBack));
        setTimeout(() => {
            flyItem['$isFlyed'] = true;
        }, 150);
    }

    FlyCompleteBack() {
        let deleteItem = [];
        let deletePos = [];
        for (let i = 0; i < this.QueueArr.length - 2; i++) {
            if (this.QueueArr[i].mapData.Type == this.QueueArr[i + 1].mapData.Type
                && this.QueueArr[i].mapData.Type == this.QueueArr[i + 2].mapData.Type
                && this.QueueArr[i].IsClickDipose()
                && this.QueueArr[i + 1].IsClickDipose()
                && this.QueueArr[i + 2].IsClickDipose()) {
                deletePos.push(i);
                deletePos.push(i + 1);
                deletePos.push(i + 2);

                MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i].mapData);
                MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i + 1].mapData);
                MapDataController.GetInstance().MoveToInvalid(this.QueueArr[i + 2].mapData);
            }
        }
        if (deletePos.length <= 0) {
            this.CheckGameOver();
            return;
        }
        for (let i = this.QueueArr.length - 1; i >= 0; i--) {
            if (deletePos.indexOf(i) > -1) {
                deleteItem.push(this.QueueArr[i]);
                this.QueueArr.splice(i, 1);
            }
        }

        for (let i = 0; i < deleteItem.length; i++) {
            this.Dispose(deleteItem[i]);
        }

        // for (let i = 0; i < this.QueueArr.length; i++) {
        //     this.TweenItem(this.QueueArr[i], i);
        // }

        deleteItem = [];
        deletePos = [];
        this.CheckGameOver();
    }

    Dispose(item: TilesItem) {
        item['$isFlyed'] = false;
        Laya.Tween.to(item, { scaleX: 0, scaleY: 0 }, 200, null, Laya.Handler.create(this, () => {
            item.removeFromParent();
            PoolMgr.GetInstance().Recover("Tiles.tiles_item", item);
        }));

    }

    TweenBack(item: TilesItem) {
        Laya.Tween.to(item, { x: item.x + this.QueueGap }, 100);
    }



    TweenLogic(item: TilesItem, pos) {
        Laya.Tween.to(item, { x: this.LogicStartPos.x + pos * (item.width - 2) }, 100);
    }

    TweenItem(item, pos) {
        Laya.Tween.to(item,
            { x: this.QueueStartPos.x + pos * this.QueueGap }, 0.1);
    }

    CheckGameFail() {
        if (this.status != 0) return;
        if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
            this.status = 1;
            UserMgr.GetInstance().StopGame();
            ViewManager.inst.popView(FailPanel);
        }
    }

    CheckGameOver() {
        if (this.status != 0) return;
        if (this.QueueArr.length >= MapDataController.GetInstance().MAX_QUEUE_TILES) {
            UserMgr.GetInstance().StopGame();
            this.status = 1;
            ViewManager.inst.popView(FailPanel);
        }

        if (this.QueueArr.length > 0) return;
        let flag = true;
        for (let i = 0; i < this.tilesItem.length; i++) {
            if (!this.tilesItem[i].IsDispose()) {
                flag = false;
                break;
            }
        }
        if (!flag) return;
        let nextLevel = MapDataController.GetInstance().HasNextLevel(this.Level);
        if (nextLevel == 99999) {
            UserMgr.GetInstance().StopGame();
            this.status = 2;
            ViewManager.inst.popView(WinPanel);
        } else {
            setTimeout(() => {
                this.initGame(nextLevel);
            }, 200);
        }
        //  if (this.Level < MapDataController)
    }

    onUpdateStatus() {
        for (let i = 0; i < this.tilesItem.length; i++) {
            this.tilesItem[i].UpdateStatus();
        }
    }


    UserProp() {
        UserMgr.GetInstance().useProp();
        let flyLogicItems = [];
        let maxLen = this.QueueArr.length > 3 ? 3 : this.QueueArr.length;
        for (let i = 0; i < maxLen; i++) {
            flyLogicItems.push(this.QueueArr[i]);
        }
        this.QueueArr.splice(0, 3);
        for (let i = 0; i < flyLogicItems.length; i++) {
            flyLogicItems[i].sortOrder = this.LogicArr.length + i;
            MapDataController.GetInstance().MoveToLogic(flyLogicItems[i].mapData);
            this.LogicArr.push(flyLogicItems[i]);
            this.FlyToLogic(flyLogicItems[i], i);
        }

        flyLogicItems = [];
        this.onRefreshUi();
    }

    onRefreshItem() {
        for (let i = 0; i < this.QueueArr.length; i++) {
            this.TweenItem(this.QueueArr[i], i);
        }
    }


    onRefreshUi() {
        let userInfo: UserInfo = UserMgr.GetInstance().getInfo();
        this.btn_prop.title = userInfo.share_item > 0 ? `x${userInfo.share_item}` : "";
    }


    public onClickButton(btn: fairygui.GButton): void {
        switch (btn) {
            case this.btn_set:
                ViewManager.inst.popView(SetPanel, { hasQuit: true });
                break;
            case this.btn_share:
                if (this.isShared) return;
                this.isShared = true;
                this.btn_share.icon = ResMgr.GetInstance().GetIconUrl("shared");
                break;
            case this.btn_prop:
                if (this.QueueArr.length <= 0) return;
                ViewManager.inst.popView(PropPanel);
                break;
        }
    }


    public onUpdate() {
        for (let i = 0; i < this.QueueArr.length; i++) {
            if (this.QueueArr[i]['$isFlyed']) {
                let x = this.QueueStartPos.x + i * this.QueueGap;
                if (x != this.QueueArr[i].x) {
                    let pos = x - this.QueueArr[i].x;
                    let abs = pos < 0 ? -1 : 1;
                    let move = this.moveTimes;
                    pos = Math.abs(pos);
                    if (pos < this.moveTimes) {
                        move = pos;
                    }
                    this.QueueArr[i].x += move * abs;
                }
                // if (this.QueueArr[i].x != this.QueueStartPos.x)
                //     this.QueueArr[i].x =;
            }
        }
    }
}