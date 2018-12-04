import * as mongoose from 'mongoose';
require('../models/file');
require('../models/keyword');

const Keyword = mongoose.model('Keyword');
const File = mongoose.model('File');

export async function saveInformationsFile(linkOriginale, linkEdited, fileName, autor, description, keywords) {
    return new Promise(async (resolve, reject) => {
        try {
            let keyword
            if (keywords) {
                keyword = await addKeywords(keywords);
            };
            if (keywords && keyword) {
                console.log("keyword", JSON.stringify(keyword));
                let file = new File({
                    keywords: keyword,
                    title: fileName,
                    linkToFileOriginal: linkOriginale,
                    linkToFileEdited: linkEdited,
                    type: "csv",
                    autor: autor,
                    description: description
                });
                file.save().then(data => {
                    console.log("dataresponse",JSON.stringify(data));
                    resolve(data);
                });
            }
        } catch{
            reject("error: create informations File")
        }
    });
}

export function addKeywords(keywords) {
    return new Promise((resolve, reject) => {
        let getPromise = [];
        let keywordObjects = [];
        keywords.forEach(keyword => {
            let query = {
                text: keyword.toLowerCase()
            };
            getPromise.push(Keyword.find(query))
        });
        Promise.all(getPromise).then(data => {
            let postPromise = [];
            console.log(data);
            data.forEach((value, i) => {
                let keyword = new Keyword({ text: keywords[i] });
                if (value.length == 0) postPromise.push(keyword.save())
                else keywordObjects.push(value[0]._id);
            })
            Promise.all(postPromise).then(data => {
                data.forEach(value => {
                    keywordObjects.push(value._id)
                })
                resolve(keywordObjects);
            }).catch(err => reject(err))
        }).catch(err => reject(err))
    });
}

