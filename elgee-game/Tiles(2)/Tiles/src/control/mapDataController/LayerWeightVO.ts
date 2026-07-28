

//层权重
export default class LayerWeightVO
{
    private weight:Array<{Type:number,StartWeight:number,EndWeight:number}>;//权重
    private totalWeight:number = 0;//总权重
    // private canRandomTypeDic:any;//可随机类型字典
    
    constructor(weight:Array<{Type:number,Weight:number}>)
    {
        this.weight = [];
        this.totalWeight = 0;
        // this.canRandomTypeDic = {};
        let startWeight:number = 0;
        for (let i:number = 0; i < weight.length; i++)
        {
            this.weight.push({Type:weight[i].Type,StartWeight:startWeight,EndWeight:startWeight + weight[i].Weight});
            // this.canRandomTypeDic[weight[i].Type] = 1;
            startWeight += weight[i].Weight;
        }
        this.totalWeight = startWeight;
    }

    //随机形状类型
    public RandomType():number
    {   
        let random = Math.floor(Math.random() * this.totalWeight);
        let weightItem:{Type:number,StartWeight:number,EndWeight:number};
        for (let i:number = 0; i < this.weight.length; i++)
        {
            weightItem = this.weight[i];
            if (random >= weightItem.StartWeight && random <= weightItem.EndWeight)
                return weightItem.Type;
        }
        return 0;
    }
    
    // //是否可以随机此类型
    // public CanRandomByType(type:number):boolean
    // {
    //     return this.canRandomTypeDic[type] ? true : false;
    // }
}