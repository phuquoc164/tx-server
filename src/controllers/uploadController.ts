//import * as csv from 'csv';
import * as fs from 'fs';
import * as csv from 'fast-csv';
import * as firstline from 'firstline';
import { ColHeader } from '../models/colHeader';
import { FileSetting } from '../models/fileSetting';
// var csv = require('fast-csv');

export async function uploadFile(req, res) {
    if (!req['file']) {
        console.log("No file received");
        return res.send({
            success: false
        });
    } else {
        console.log('file received');
        return res.send({
            success: true,
            link: req['file'].path,
            firstRow: await readFirstLine(req['file'].path)
        })
    }
}

export function readFirstLine(fileURL): Promise<any> {
    return new Promise<any>(resolve => {
        let firstRow = [];
        firstline(fileURL).then(data => {
            firstRow = data.split(";");
            resolve(firstRow);
        });

        // let parser = csv.parse({ delimiter: ';' }, (err, data) => {
        //     data.every((row, rowNumber) => {
        //         if (rowNumber == 0) {
        //             row.forEach(col => {
        //                 firstRow.push(col);
        //             })
        //             console.log(firstRow);
        //             resolve(firstRow)
        //         }
        //     });
        // });
        // fs.createReadStream(fileURL).pipe(parser);(e)

        // fs.createReadStream(fileURL)
        //     .pipe(csv.parse({ delimiter: ';' }))
        //     .on('data', function (csvrow) {
        //         firstRow.push(csvrow[0]);
        //         resolve(firstRow);
        //     })

        // var fileStream = fs.createReadStream(fileURL);
        // var csvStream = csv({ headers: true });

        // fileStream.pipe(csvStream);

        // var rows = [];
        // var onData = function (row) {
        //     rows.push(row);
        //     if (rows.length == 1) {
        //         row.forEach(col => {
        //             firstRow.push(col);
        //         })
        //         console.log(firstRow);
        //         resolve(firstRow)

        //         csvStream.emit('donereading'); //custom event for convenience
        //     }
        // };
        // csvStream.on('data', onData);
        // csvStream.on('donereading', function () {
        //     fileStream.close();
        //     csvStream.removeListener('data', onData);
        //     console.log('got 20 rows', rows);
        // });
    });
}

export function analyseFile(req, res) {
    let body = req['body'];
    let colsHeader: ColHeader = body['colsHeader'];
    console.log("colsHeader", body['colsHeader'])
    console.log("linkOriginale", body['linkOriginale'])
    let fileSetting: FileSetting = new FileSetting(body['linkOriginale'], body['isUseFirstLink'], body['isDeleteFirstLink'], body['selectAll'], body['colsHeader'])
    console.log("linkOriginalesau", fileSetting.linkOriginale)
    console.log(JSON.stringify(fileSetting.colsHeader))

    console.log(JSON.stringify(fileSetting));
    readFile(fileSetting);
    return res.send({
        success: true
    })
}

export function readFile(fileSetting) {
    // var fs = require('fs');
    // var csv = require('fast-csv');

    let fileStream = fs.createReadStream(fileSetting.linkOriginale);
    let csvStream = csv({ delimiter:';' }); //headers: true, 

    fileStream.pipe(csvStream);

    let csvStreamWrite = csv.createWriteStream({headers: true});
    let writableStream = fs.createWriteStream("uploads/my.csv");
    
    writableStream.on("finish", function(){
        console.log("DONE!");
    });
      
    csvStreamWrite.pipe(writableStream);

    let numRow =0;
    let firstRow = fileSetting.colsHeader.map(colHeader => {
        return colHeader.colName;
    })
    let datasSelected = fileSetting.colsHeader.filter(colHeader => {
        return colHeader.selected == true;
    })
    console.log('data ', JSON.stringify(datasSelected));

    let dataEmpty = {};
    let onData = function (row) {
        //if (fileSetting.isDeleteFirstLink) return;
        numRow++;
        let rowData = {}; 
        datasSelected.forEach((data,i)=>{
            if(row[data.id] == ""){
                if (!dataEmpty[data.id]) dataEmpty[data.id] = 1;
                else dataEmpty[data.id]++
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
        console.log("data", JSON.stringify(dataEmpty))
        csvStreamWrite.end();
        fileStream.close();
        csvStream.removeListener('data', onData);
    });

}


// var fs = require('fs');
// var csv = require('fast-csv');

// var fileStream = fs.createReadStream(fileURL);
// var csvStream = csv({headers: true});

// fileStream.pipe(csvStream);

// var rows = [];
// var onData = function(row){
//   rows.push(row);
//   if (rows.length == 20) {
//     csvStream.emit('donereading'); //custom event for convenience
//   }
// };
// csvStream.on('data', onData);
// csvStream.on('donereading', function(){
//   fileStream.close();
//   csvStream.removeListener('data', onData);
//   console.log('got 20 rows', rows);
// });

