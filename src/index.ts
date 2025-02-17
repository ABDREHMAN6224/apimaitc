import express from 'express';
import dotenv from 'dotenv';
import {google} from "googleapis";
import path from 'path';
import { Client } from '@notionhq/client';
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

// main().catch(console.error);

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

// Example usage
addTask("Complete Notion API Integration", "2025-02-20");