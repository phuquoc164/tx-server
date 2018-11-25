export class ColHeader {
    colName: string;
    id: number;
    selected: boolean;
    type: string = 'string'; // string, date, number
    dataEmpty: any;
    dataError: any;
    constructor(id:any, colName:any){
        this.colName = colName;
        this.id = id;
    }
    
    select(){
        this.selected = true;
    }

    unSelect(){
        this.selected = false;
    }

    setType(type){
        this.type = type;
    }
}