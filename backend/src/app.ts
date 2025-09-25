import express from "express";
import type { Application } from "express";
import cors from 'cors' ;
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// import {connectToDatabse} from './config/db.config' ;
// import {errorMiddleware} from './middleware/error.middleware';
// import apiRoutes from './api' ;

const app : Application = express();


// Middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true})) ;


export default app ;