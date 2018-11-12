import * as csv from 'csv';
import * as fs from 'fs';

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
            firstRow: await readFile(req['file'].path)
        })
    }
}

export function readFile(fileURL): Promise<any> {
    return new Promise<any>(resolve => {
        let firstRow = [];
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
        // fs.createReadStream(fileURL).pipe(parser);

        fs.createReadStream(fileURL)
            .pipe(csv.parse({ delimiter: ';' }))
            .on('data', function (csvrow) {
                firstRow.push(csvrow[0]);
                resolve(firstRow);
            })
    });
}