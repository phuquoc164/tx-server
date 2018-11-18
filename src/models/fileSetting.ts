import { ColHeader } from "./colHeader";

export class FileSetting {
    linkOriginale: string;
    isUseFirstLink: boolean;
    isDeleteFirstLink: boolean;
    selectAll: boolean; 
    colsHeader: ColHeader[] =[];

    constructor(linkOriginale:string, isUseFirstLink:boolean, isDeleteFirstLink:boolean, selectAll:boolean, colsHeader: ColHeader[]){
        this.linkOriginale = linkOriginale;
        this.isUseFirstLink = isUseFirstLink;
        this.isDeleteFirstLink = isDeleteFirstLink
        this.selectAll = selectAll;
        this.colsHeader = colsHeader
    }
}