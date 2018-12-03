import * as mongoose from 'mongoose';
require('../models/file');
require('../models/keyword');

const Keyword = mongoose.model('Keyword');
const File = mongoose.model('File');

export async function saveInformationsFile(linkOriginale, linkEdited, fileName, autor, description, keywords) {    
    return new Promise((resolve, reject) => {
        addKeywords(keywords)
    });
}

export async function addKeywords(keywords) {    
    return new Promise((resolve, reject) => {
        let getPromise = [];
        keywords.forEach(keyword => {
            console.log(keyword)
            let query = {
                text: keyword.toLowerCase()
            };    
            getPromise.push(Keyword.find(query))
        });
        Promise.all(getPromise).then(data =>{
            console.log(data)
        })

    });
}

