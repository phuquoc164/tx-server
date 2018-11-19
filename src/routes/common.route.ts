import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { uploadFile, analyseFile } from '../controllers/uploadController';
export class CommonRouter {
    router = express.Router();
    DIR = 'uploads';
 
    
    constructor() {
        this.init();
    }

    init() {
        /**this.router.[get/post/put/delete]('/[nameroute]',[controllerFunction]) */
        this.router.get('/', (req, res) => {
            res.json({
                message: 'Hello World from Server!'
            })
        })

        let storage = multer.diskStorage({
            destination: (req, file, cb) => {
              cb(null, this.DIR);
            },
            filename: (req, file, cb) => {
              cb(null, file.originalname);
            }
        });
        let upload = multer({storage: storage});
    

        this.router.post('/upload',upload.single('csv'), uploadFile);
        this.router.post('/analyseFile', analyseFile);
    }

}

const commonRouter = new CommonRouter();

export default commonRouter.router;
