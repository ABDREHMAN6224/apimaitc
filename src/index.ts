import express from 'express';
import dotenv from 'dotenv';
import {google} from "googleapis";
import path from 'path';
dotenv.config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'keys.json'),
    scopes: ['https://www.googleapis.com/auth/tasks'],
  });
const tasks = google.tasks({
    version: 'v1',
    auth: auth,
});


const main = async () => {

    const res = await tasks.tasklists.list();
      console.log(res.data);
}

main().catch(console.error);