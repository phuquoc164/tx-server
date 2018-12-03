import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    keywords: [{ type: Schema.Types.ObjectId, ref: 'keywordSchema' }],
    title: String,
    linkToFileOriginal: String,
    linkToFileEdited: String,
    type: String,
    autor: String,
    description: String,
    dateCreated:  { type: Date, default: new Date() }
}, { collection: "file" });

mongoose.model("File", fileSchema);