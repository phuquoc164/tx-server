import * as mongoose from 'mongoose';
require('../models/file');
require('../models/keyword');

const Keyword = mongoose.model('Keyword');
const File = mongoose.model('File');

export async function saveInformationsFile(linkOriginale, linkEdited, fileName, autor, description, keywords) {
    return new Promise(async (resolve, reject) => {
        try {
            let file = new File({
                keywords: [],
                title: fileName,
                linkToFileOriginal: linkOriginale,
                linkToFileEdited: linkEdited,
                type: "csv",
                autor: autor,
                description: description
            });
            file.save().then(data => {
                console.log("dataresponse", JSON.stringify(data));
                if (keywords) {
                    addKeywords(keywords, file).then(keyword => {
                        console.log("keyword", JSON.stringify(keyword));
                        data["keywords"] = keyword;
                        data.save().then(data => {
                            console.log("dataresponse", JSON.stringify(data));
                            resolve(data);
                        });    
                    }).catch(err => console.log(err));
                };
            }).catch(err =>console.log(err));
        } catch{
            reject("error: create informations File")
        }
    });
}

export function addKeywords(keywords, file) {
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
                let keyword = new Keyword({ text: keywords[i], files: [file._id]});
                if (value.length == 0) postPromise.push(keyword.save())
                if (value.length > 0) {
                    console.log(JSON.stringify(value));
                    if (!value[0].files) value[0].files = [];
                    value[0].files.push(file._id);
                    postPromise.push(value[0].save())
                }
                // else keywordObjects.push(value[0]._id);
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

export function updateLinkFileById(_id, linkEdited) {
    return new Promise((resolve, reject) => {
        File.findById(_id)
            .then(file => {
                file['linkToFileEdited'] = linkEdited
                file.save().then(data => resolve(data)).catch(err => reject(err));
            });
    });
}

