import express from 'express';
import dotenv from 'dotenv';
import {google} from "googleapis";
import path from 'path';
import { Client } from '@notionhq/client';
// @ts-ignore
import { authenticate } from "@google-cloud/local-auth";
dotenv.config();

// const auth = new google.auth.GoogleAuth({
//     keyFile: path.join(__dirname, 'keys.json'),
//     scopes: ['https://www.googleapis.com/auth/tasks'],
//   });

const SCOPES = ["https://www.googleapis.com/auth/tasks"];

async function authorize() {
    return await authenticate({
        keyfilePath: path.join(__dirname, "credentials.json"), 
        scopes: SCOPES,
    });
}





const notion = new Client({ auth: process.env.NOTION_SECRET});
const databaseId = process.env.NOTION_DB_ID;

async function addTask(title:string, dueDate:string) {
    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseId! },
            properties: {
                Name: {
                    title: [{ text: { content: title } }]
                },
                Due: {
                    date: { start: dueDate }
                }
            }
        });
        console.log('Task added:', response);
    } catch (error) {
        console.error(error);
    }
}

const main = async () => {
    const auth = await authorize();
    const tasks = google.tasks({version: 'v1', auth});
    const res = await tasks.tasklists.list();
    const listData = res.data.items?.map((item) => {return {id: item.id, title: item.title,updated: item.updated}});
    listData?.forEach(async (list) => {
        const res = await tasks.tasks.list({
            tasklist: list.id!,
            showHidden: true,
            showAssigned: true,
            showDeleted: true,
            showCompleted: true,
        })
        console.log(res.data.items?.map((item) => {return {id: item.id, title: item.title,updated: item.updated,due: item.due,completed: item.completed??false}}));
        // const tasksData = res.data.items?.map((item) => {return {id: item.id, title: item.title,updated: item.updated}});
    });
}

main().catch(console.error);