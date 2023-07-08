import express from 'express';
import connection from './database/db.js';
// import Router from './routes/route.js';

import dotenv from 'dotenv';
 import http from 'http';
import './replCmd/repl.js'

dotenv.config();
const app=express();
const server=http.createServer(app)//server created for chat app


const PORT=process.env.PORT || 8000;
server.listen(PORT, ()=>{});

const username=process.env.DB_USERNAME;
const password=process.env.db_password;
const DB=process.env.MONGODB_URI ||`mongodb+srv://${username}:${password}@cluster0.i4nhnfk.mongodb.net/GoKart?retryWrites=true&w=majority`;

connection(DB);

