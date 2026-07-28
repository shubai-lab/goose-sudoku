import LayerWeightVO from "./LayerWeightVO";
import ShapeAreaType from "./ShapeAreaType";
import ShapeStatusType from "./ShapeStatusType";

//形状格子数据
export default class ShapeGridVO
{
    public LayerIndex:number = 0;//层级索引(从0开始)
    public GridIndex:number = 0;//格子索引(从0开始)
    public X:number = 0;//坐标x
    public Y:number = 0;//坐标y
    public Type:number = 0;//形状类型：0表示需要随机
    public weight:LayerWeightVO;//权重：随机用
    public Status:number = ShapeStatusType.DISABLE;//状态
    public Area:number = ShapeAreaType.OPERATION;//区域

    private beforeGrids:Array<ShapeGridVO>;//前置格子
    private afterGrids:Array<ShapeGridVO>;//后置格子

    constructor()
    {
        
    }

    //获取实例
    public static GetInstance(layerIndex:number,gridIndex:number,layoutInfo:{X:number,Y:number,Type:number},weight:LayerWeightVO):ShapeGridVO
    {
        if (!layoutInfo || !weight) return null;
        let shapeGrid:ShapeGridVO = Laya.Pool.getItemByClass("ShapeGridVO",ShapeGridVO);
        shapeGrid.ResetData(layerIndex,gridIndex,layoutInfo,weight);
        return shapeGrid;
    }

    //回收实例
    public static Recover(instance:ShapeGridVO):void
    {
        if (!instance) return;
        instance.ClearData();
        Laya.Pool.recover("ShapeGridVO",instance);
    }

    //重置数据
    public ResetData(layerIndex:number,gridIndex:number,layoutInfo:{X:number,Y:number,Type:number},weight:LayerWeightVO):void
    {
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

    //清理数据
    public ClearData():void
    {
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

    //添加前置格子
    public AddBeforeGrid(shapeGridVo:ShapeGridVO):void
    {
        if (!this.beforeGrids)
            this.beforeGrids = [];
        this.beforeGrids.push(shapeGridVo);
    }

    //添加后置格子
    public AddAfterGrid(shapeGridVo:ShapeGridVO):void
    {
        if (!this.afterGrids)
            this.afterGrids = [];
        this.afterGrids.push(shapeGridVo);
    }

    //获取前置格子
    public get BeforeGrids():Array<ShapeGridVO>
    {
        return this.beforeGrids;
    }

    //获取后置格子
    public get AfterGrids():Array<ShapeGridVO>
    {
        return this.afterGrids;
    }

    //是否有前置格子
    public get IsExistBeforeGrid():boolean
    {
        return this.beforeGrids && this.beforeGrids.length > 0 ? true : false;
    }

    //随机形状类型
    public RandomType():number
    {
        if (this.Type != 0) 
            return this.Type;
        return this.weight.RandomType();
    }

    // //是否可以随机此类型
    // public CanRandomByType(type:number):boolean
    // {
    //     return this.weight.CanRandomByType(type);
    // }
}