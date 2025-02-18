import dotenv from "dotenv";
import { google } from "googleapis";
import path from "path";
import { Client } from "@notionhq/client";
// @ts-ignore
import cron from "node-cron";
// @ts-ignore
import { AuthClient } from "./utils/Auth";
import { Task } from "./utils/types";
dotenv.config();





const notion = new Client({ auth: process.env.NOTION_SECRET });
const databaseId = process.env.NOTION_DB_ID;

const getTasks = async (auth: any) => {
  const allTasks: Task[] = [];
  const tasks = google.tasks({ version: "v1", auth });
  const res = await tasks.tasklists.list();
  const listData = res.data.items?.map((item) => {
    return { id: item.id, title: item.title, updated: item.updated };
  });
  await Promise.all(
    listData?.map(async (list) => {
      const res = await tasks.tasks.list({
        tasklist: list.id!,
        showHidden: true,
        showAssigned: true,
        showDeleted: true,
        showCompleted: true,
      });

      const ts = res.data.items?.map((item) => ({
        id: item.id!,
        title: item.title ?? "No title",
        updated: new Date(item.updated!),
        due: item.due ? new Date(item.due) : null,
        completed: item.completed ?? "Pending",
      }));

      if (ts) allTasks.push(...ts);
    }) ?? []
  );
  return allTasks;
};

async function getNotionTaskIds() {
  const response = await notion.databases.query({
    database_id: databaseId!,
  });

  // @ts-ignore
  const ids = response.results.map(
      // @ts-ignore
    (page) => page.properties.googleId.rich_text[0].text.content
  );

  return ids;
}

async function syncTasksToNotion(tasks: Task[]) {
  try {
    for (const task of tasks) {
      await notion.pages.create({
        parent: { database_id: databaseId! },
        properties: {
          title: {
            rich_text: [{ text: { content: task.title } }],
          },
          Due: {
            date: {
              start: task.due
                ? task.due.toISOString()
                : new Date().toISOString(),
            },
          },
          completed: {
            rich_text: [{ text: { content: task.completed } }],
          },
          googleId: {
            rich_text: [{ text: { content: task.id } }],
          },
          updated: {
            date: { start: task.updated.toISOString() },
          },
        },
      });
      console.log(`Task "${task.title}" added to Notion.`);
    }
  } catch (error) {
    console.error("Error syncing tasks:", error);
  }
}


const syncTasks = async () => {
  AuthClient.getInstance()
    .auth.then(async (auth: AuthClient) => {
      const tasks = await getTasks(auth);
      const ids = await getNotionTaskIds();
      syncTasksToNotion(
        tasks.filter((task) => !ids.some((id) => id == task.id))
      );
    })
    .catch((err: any) => {
      console.log(err);
    });
};


syncTasks();
cron.schedule("*/2 * * * *", syncTasks);