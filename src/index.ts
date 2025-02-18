import dotenv from "dotenv";
import { google } from "googleapis";
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
  //   promisifying because without awaiting this task allTasks array will be empty at execution time
  await Promise.all(
    listData?.map(async (list) => {
      const res = await tasks.tasks.list({
        tasklist: list.id!,
        showHidden: true,
        showAssigned: true,
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

async function deleteFromNotion(ids: string[]) {
  try {
    for (let googleId of ids) {
      const response = await notion.databases.query({
        database_id: databaseId!,
        filter: {
          property: "googleId",
          rich_text: {
            equals: googleId,
          },
        },
      });

      if (response.results.length === 0) {
        console.log(`No task found with googleId: ${googleId}`);
        return;
      }

      const pageId = response.results[0].id;

      await notion.pages.update({
        page_id: pageId,
        archived: true,
      });

      console.log(`Task with googleId "${googleId}" deleted from Notion.`);
    }
  } catch (error) {
    console.error("Error deleting task:", error);
  }
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
      const deleteIds = ids.filter((id) => !tasks.some((t) => t.id == id));
    //   delete tasks which were deleted by user in google tasks
      await deleteFromNotion(deleteIds);
        await syncTasksToNotion(
          // only add new tasks
          tasks.filter((task) => !ids.some((id) => id == task.id))
        );
    })
    .catch((err: any) => {
      console.log(err);
    });
};

syncTasks();
// * * * * *
// | | | | |
// | | | | +----- day of the week (0 - 7) (Sunday=0 or 7)
// | | | +------- month (1 - 12)
// | | +--------- day of the month (1 - 31)
// | +----------- hour (0 - 23)
// +------------- minute (0 - 59)

// checks every two minutes and adds new tasks on notion
cron.schedule("*/2 * * * *", syncTasks);
