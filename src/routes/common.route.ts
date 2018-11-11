import * as express from 'express';

export class CommonRouter {
    router = express.Router();

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


    }

}

const commonRouter = new CommonRouter();

export default commonRouter.router;
