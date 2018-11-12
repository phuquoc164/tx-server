import * as express from 'express';
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import { CommonRouter } from './routes/common.route';
import { MongooseConfig } from './config/mongoose.config';
//const mongooseConfig = require('./config/mongoose.config');

class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.mongoSetup().then(db => {
            this.middleware();
        })
    }

    middleware() {
        try {
            this.app.set('port', 9001);
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended: true }));
            this.app.use(function (req, res, next) {

                // Website you wish to allow to connect
                res.setHeader('Access-Control-Allow-Origin', '*');

                // Request methods you wish to allow
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

                // Request headers you wish to allow
                res.setHeader('Access-Control-Allow-Headers', 'X-ACCESS_TOKEN, Access-Control-Allow-Origin, Authorization, Origin, x-requested-with, Content-Type, Content-Range, Content-Disposition, Content-Description');

                // Set to true if you need the website to include cookies in the requests sent
                // to the API (e.g. in case you use sessions)
                res.setHeader('Access-Control-Allow-Credentials', 'true');

                // Pass to next layer of middleware
                next();
            });
            this.mountRoutes();
            this.app.listen(this.app.get('port'), () => {
                console.log('Express server listening on port ' + this.app.get('port'));
            });
        } catch (err) {
            console.log('error ' + err);
        }
    }

    private mountRoutes(): void {
        const commonRouter = new CommonRouter();
        this.app.use('/', commonRouter.router)
    }

    private mongoSetup(): Promise<any> {
        (<any>mongoose).Promise = global.Promise;
        return new Promise((resolve, reject) => {
            let db = mongoose.connect(MongooseConfig.uri, { useNewUrlParser: true }).then(() => {
                resolve(db);
                console.log('contected to db hehe')
            }).catch((err) => {      
                reject(err);
            });
        });
    }
}

export default new Server().app;
