import ShapeAreaType from "./ShapeAreaType";
import ShapeStatusType from "./ShapeStatusType";
export default class ShapeGridVO {
    constructor() {
        this.LayerIndex = 0;
        this.GridIndex = 0;
        this.X = 0;
        this.Y = 0;
        this.Type = 0;
        this.Status = ShapeStatusType.DISABLE;
        this.Area = ShapeAreaType.OPERATION;
    }
    static GetInstance(layerIndex, gridIndex, layoutInfo, weight) {
        if (!layoutInfo || !weight)
            return null;
        let shapeGrid = Laya.Pool.getItemByClass("ShapeGridVO", ShapeGridVO);
        shapeGrid.ResetData(layerIndex, gridIndex, layoutInfo, weight);
        return shapeGrid;
    }
    static Recover(instance) {
        if (!instance)
            return;
        instance.ClearData();
        Laya.Pool.recover("ShapeGridVO", instance);
    }
    ResetData(layerIndex, gridIndex, layoutInfo, weight) {
        this.LayerIndex = layerIndex;
        this.GridIndex = gridIndex;
        this.X = layoutInfo.X;
        this.Y = layoutInfo.Y;
        this.Type = layoutInfo.Type;
        this.weight = weight;
        this.Status = ShapeStatusType.DISABLE;
        this.Area = ShapeAreaType.OPERATION;
        this.beforeGrids = null;
        this.afterGrids = null;
    }
    ClearData() {
        this.LayerIndex = 0;
        this.GridIndex = 0;
        this.X = 0;
        this.Y = 0;
        this.Type = 0;
        this.Status = ShapeStatusType.DISABLE;
        this.Area = ShapeAreaType.INVALID;
        this.weight = null;
        this.beforeGrids = null;
        this.afterGrids = null;
    }
    AddBeforeGrid(shapeGridVo) {
        if (!this.beforeGrids)
            this.beforeGrids = [];
        this.beforeGrids.push(shapeGridVo);
    }
    AddAfterGrid(shapeGridVo) {
        if (!this.afterGrids)
            this.afterGrids = [];
        this.afterGrids.push(shapeGridVo);
    }
    get BeforeGrids() {
        return this.beforeGrids;
    }
    get AfterGrids() {
        return this.afterGrids;
    }
    get IsExistBeforeGrid() {
        return this.beforeGrids && this.beforeGrids.length > 0 ? true : false;
    }
    RandomType() {
        if (this.Type != 0)
            return this.Type;
        return this.weight.RandomType();
    }
}
//# sourceMappingURL=ShapeGridVO.js.map