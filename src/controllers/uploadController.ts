//import * as csv from 'csv';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import * as firstline from 'firstline';
import { ColHeader } from '../models/colHeader';
import { FileSetting } from '../models/fileSetting';
import { saveInformationsFile } from '../services/uploadService';
// var csv = require('fast-csv');

export async function uploadFile(req, res) {
    try {
        if (!req['file']) {
            console.log("No file received");
            return res.status(500).send({
                success: false,
                error: "No file received"
            });
        } else {
            console.log('file received');
            return res.status(200).send({
                success: true,
                link: req['file'].path,
                firstRow: await readFirstLine(req['file'].path)
            })
        }
    } catch{
        return res.status(500).send({ error: "Error upload file" });
    }
}

export function readFirstLine(fileURL): Promise<any> {
    return new Promise<any>(resolve => {
        let firstRow = [];
        firstline(fileURL).then(data => {
            console.log(";", data.split(";").length);
            console.log(data.split(",").length);

            firstRow = (data.split(";").length > 1) ? data.split(";") : ((data.split(",").length > 1) ? data.split(",") : data.split(";"));
            resolve(firstRow);
        });
    });
}

export async function analyseFile(req, res) {
    let body = req['body'];
    let colsHeader: ColHeader = body['colsHeader'];
    console.log("colsHeader", body['colsHeader'])
    console.log("linkOriginale", body['linkOriginale'])
    let fileSetting: FileSetting = new FileSetting(body['linkOriginale'], body['isUseFirstLink'], body['isDeleteFirstLink'], body['selectAll'], body['colsHeader'])
    console.log("linkOriginalesau", fileSetting.linkOriginale)
    console.log(JSON.stringify(fileSetting.colsHeader))
    console.log(JSON.stringify(fileSetting));
    try {
        res.status(200).send({
            success: true,
            data: await readFile(fileSetting)
        })
    } catch{
        res.status(500).send({
            success: false,
            error: "error analyseFile"
        })
    }
}

export function readFile(fileSetting): Promise<any> {
    return new Promise<any>(resolve => {

        let fileStream = fs.createReadStream(fileSetting.linkOriginale);
        let csvStream = csv({ delimiter: ';' }); //headers: true, 

        fileStream.pipe(csvStream);

        let csvStreamWrite = csv.createWriteStream({ headers: true });
        let pos = fileSetting.linkOriginale.indexOf(".csv");
        let name = fileSetting.linkOriginale.substring(0, pos);
        let urlFile = name + "_edited.csv";
        let writableStream = fs.createWriteStream(urlFile);

        writableStream.on("finish", function () {
            console.log("DONE!");
        });

        csvStreamWrite.pipe(writableStream);

        let numRow = 0;
        let firstRow = fileSetting.colsHeader.map(colHeader => {
            return colHeader.colName;
        })
        let datasSelected;
        if (fileSetting.selectAll) {
            datasSelected = fileSetting.colsHeader;
        } else {
            datasSelected = fileSetting.colsHeader.filter(colHeader => {
                return colHeader.selected == true;
            })
        }
        console.log('data ', JSON.stringify(datasSelected));

        let dataEmpty = {};
        let dataError = {};
        let onData = function (row) {
            if (fileSetting.isDeleteFirstLink && numRow == 0) {
                numRow++;
                return;
            }
            numRow++;
            let rowData = {};
            datasSelected.forEach((data, i) => {
                if (!row[data.id] || row[data.id] == "" || row[data.id] == null) {
                    if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                    else dataEmpty[data.id]++
                    row[data.id] = "";
                } else if (!isValid(data.type, row[data.id])) {
                    if (!dataError[data.id]) dataError[data.id] = 1;
                    else dataError[data.id]++
                }
                rowData[data.colName] = row[data.id];
            });

            csvStreamWrite.write(rowData);
            // if (numRow == 15) {
            //     console.log("data", JSON.stringify(dataEmpty))
            //     csvStreamWrite.end();
            //     csvStream.emit('donereading'); //custom event for convenience
            // }
        };
        csvStream.on('data', onData);
        csvStream.on('donereading', function () {
            fileStream.close();
            csvStream.removeListener('data', onData);
        });
        csvStream.on('end', function () {
            console.log("data", JSON.stringify(dataEmpty));
            console.log("dataError", JSON.stringify(dataError));
            csvStreamWrite.end();
            fileStream.close();
            csvStream.removeListener('data', onData);
            numRow = (fileSetting.isDeleteFirstLink) ? numRow - 1 : numRow;
            let dataresponse = createColHeaderArrayAfterAnalyse(datasSelected, dataEmpty, dataError, numRow)
            console.log("response", JSON.stringify(dataresponse));
            resolve({ datasFile: dataresponse, urlFile: urlFile });
        });
    })
}

function isValid(type, data) {
    let isvalid;
    if (!data) return true
    switch (type.toLowerCase()) {
        case "number":
            isvalid = isNaN(data) ? false : true
            break;
        case "date":
            isvalid = isNaN(Date.parse(data)) ? false : true
            break;
        default:
            isvalid = true;
    }
    return isvalid
}

function createColHeaderArrayAfterAnalyse(datasSelected: ColHeader[], dataEmpty, dataError, dataCount) {
    datasSelected.forEach((ele, i) => {
        if (dataEmpty[ele.id]) ele.dataEmpty = dataEmpty[ele.id] / dataCount;
        if (dataError[ele.id]) ele.dataError = dataError[ele.id] / dataCount;
        ele.id = i;
    });
    return datasSelected;
}

export async function analyseInformationsFile(req, res) {
    let body = req['body'];
    let linkOriginale = body['linkOriginale'];
    let linkEdited = body['linkEdited'];
    let informationsFile = body['informationsFile'];
    try {
        let dataResponse = await saveInformationsFile(linkOriginale, linkEdited, informationsFile.fileName, informationsFile.autor, informationsFile.description, informationsFile.keywords);

        res.status(200).send({
            success: true,
            dataResponse: dataResponse,
            data: {
                linkOriginale: linkOriginale,
                linkEdited: linkEdited,
                fileName: informationsFile.fileName,
                autor: informationsFile.autor,
                description: informationsFile.description,
                keywords: informationsFile.keywords
            }
        })
    } catch{
        res.status(500).send({ error: "error when adding informations file" })
    }
}
