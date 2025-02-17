import express from 'express';
import dotenv from 'dotenv';
import {google} from "googleapis";
dotenv.config();

const oAuth2client = new google.auth.OAuth2({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
})

oAuth2client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});
const tasks = google.tasks({
    version: 'v1',
    auth: oAuth2client
});

const app = express();


const main = async () => {

    const res = await tasks.tasklists.list();
      console.log(res.data);
}

main().catch(console.error);