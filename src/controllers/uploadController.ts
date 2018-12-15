//import * as csv from 'csv';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import * as firstline from 'firstline';
import { ColHeader } from '../models/colHeader';
import { FileSetting } from '../models/fileSetting';
import { saveInformationsFile, updateLinkFileById } from '../services/uploadService';
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

        let csvStreamWrite = csv.createWriteStream({ headers: true, delimiter: ';' });
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
        let dataErrorOrEmpty = [];
        let onData = function (row) {
            if (fileSetting.isDeleteFirstLink && numRow == 0) {
                numRow++;
                return;
            }
            numRow++;
            let rowData = {};
            let isEmptyOrError = false;
            datasSelected.forEach((data, i) => {
                if (!row[data.id] || row[data.id] == "" || row[data.id] == null) {
                    if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                    else dataEmpty[data.id]++
                    row[data.id] = "";
                    isEmptyOrError = true;
                } else if (!isValid(data.type, row[data.id])) {
                    if (!dataError[data.id]) dataError[data.id] = 1;
                    else dataError[data.id]++
                    isEmptyOrError = true;
                }
                rowData[data.colName] = row[data.id];
            });
            if (isEmptyOrError && dataErrorOrEmpty.length <= 10) dataErrorOrEmpty.push(rowData);
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
            resolve({ datasFile: dataresponse, urlFile: urlFile, dataErrorOrEmpty: dataErrorOrEmpty });
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
        ele.dataEmpty = (dataEmpty[ele.id]) ? dataEmpty[ele.id] / dataCount : 0;
        ele.dataError = (dataError[ele.id]) ? dataError[ele.id] / dataCount : 0;
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
                keywords: informationsFile.keywords,
                _id: dataResponse['_id']
            }
        })
    } catch{
        res.status(500).send({ error: "error when adding informations file" })
    }
}

export async function improveData(req, res) {
    let body = req['body'];
    console.log(JSON.stringify(body))

    res.status(200).send({
        success: true,
        data: await improveFile(body)
    });
}

export function improveFile(fileSetting): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        let fileStream = fs.createReadStream(fileSetting.linkEdited);
        let csvStream = csv({ delimiter: ';' });
        fileStream.pipe(csvStream);
        let csvStreamWrite = csv.createWriteStream({ headers: true, delimiter: ';' });
        let pos = fileSetting.linkEdited.indexOf("_edited.csv");
        let name = fileSetting.linkEdited.substring(0, pos);
        let urlFile = name + "_improved.csv";
        let writableStream = fs.createWriteStream(urlFile);

        writableStream.on("finish", function () {
            console.log("DONE!");
        });

        csvStreamWrite.pipe(writableStream);

        let numRow = 0;
        let firstRow = fileSetting.colsHeader.map(colHeader => {
            return colHeader.colName;
        })
        let datasSelected = fileSetting.colsHeader;
        console.log('data ', JSON.stringify(datasSelected));

        let dataEmpty = {};
        let dataError = {};
        let optionsDataEmpty = fileSetting.optionsOptimisationDataEmpty;
        let optionsDataFail = fileSetting.optionsOptimisationDataFail;
        let onData = function (row) {
            if (numRow == 0) {
                numRow++;
                return;
            }
            let rowData = {};
            datasSelected.forEach((data, i) => {
                if (i < 2) console.log(JSON.stringify(row))
                if (!row[data.id] || row[data.id] == "" || row[data.id] == null) {
                    if (optionsDataEmpty[data.id].isDeleteRow) {
                        return;
                    } else if (optionsDataEmpty[data.id].isDeleteField) {
                        row[data.id] = "";
                        if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                        else dataEmpty[data.id]++
                    } else if (optionsDataEmpty[data.id].isFillIn) {
                        row[data.id] = optionsDataEmpty[data.id].fill;
                        if (!isValid(data.type, optionsDataFail[data.id].fill)) {
                            if (!dataError[data.id]) dataError[data.id] = 1;
                            else dataError[data.id]++
                        }
                    } else {
                        if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                        else dataEmpty[data.id]++
                    }
                } else if (!isValid(data.type, row[data.id])) {
                    if (optionsDataFail[data.id].isDeleteRow) {
                        return;
                    } else if (optionsDataFail[data.id].isDeleteField) {
                        row[data.id] = "";
                        if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                        else dataEmpty[data.id]++
                    } else if (optionsDataFail[data.id].isFillIn) {
                        row[data.id] = optionsDataFail[data.id].fill;
                        if (!isValid(data.type, optionsDataFail[data.id].fill)) {
                            if (!dataError[data.id]) dataError[data.id] = 1;
                            else dataError[data.id]++
                        }
                    } else {
                        if (!dataError[data.id]) dataError[data.id] = 1;
                        else dataError[data.id]++
                    }
                }
                rowData[data.colName] = row[data.id];
            });
            numRow++;
            csvStreamWrite.write(rowData);
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
            numRow = numRow - 1;
            let dataresponse = createColHeaderArrayAfterAnalyse(datasSelected, dataEmpty, dataError, numRow)
            console.log("response", JSON.stringify(dataresponse));
            updateLinkFileById(fileSetting._id, urlFile).then(data => {
                resolve({ datasFile: dataresponse, urlFile: urlFile });
            }).catch(err => reject(err))
        });
    })
}