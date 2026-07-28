import { MsgType } from "../control/FguiMananger";
import ShapeAreaType from "../control/mapDataController/ShapeAreaType";
import ShapeStatusType from "../control/mapDataController/ShapeStatusType";
import { mvc } from "../control/mvc";
import ResMgr from "../control/ResMgr";
export default class TilesItem extends fgui.GButton {
    init(mapData) {
        this.mapData = mapData;
        this.setXY(ResMgr.GetInstance().OffSet.X + mapData.X, ResMgr.GetInstance().OffSet.Y + mapData.Y);
        this.onClick(this, this.ClickItem, [this]);
        this.icon = ResMgr.GetInstance().GetIconUrl(this.mapData.Type + "");
    }
    ClickItem(item) {
        if (item.mapData.Status == ShapeStatusType.DISABLE) {
            return;
        }
        mvc.event(MsgType.CLICK_TILES, item);
    }
    UpdateStatus() {
        let canClick = this.mapData.Status == ShapeStatusType.ENABLE;
        this.getController('hasMask').selectedIndex = canClick ? 0 : 1;
    }
    IsClickDipose() {
        return this.mapData.Area == ShapeAreaType.COLLECTION;
    }
    IsDispose() {
        return this.mapData.Area == ShapeAreaType.INVALID;
    }
}
//# sourceMappingURL=TilesItem.js.map