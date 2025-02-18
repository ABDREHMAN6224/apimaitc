import { authenticate } from "@google-cloud/local-auth";
import path from 'path';
const SCOPES = ["https://www.googleapis.com/auth/tasks"];

// thsi is authclient setup on singleton pattern so that i can use the same auth object in multiple places and avoid logging in every single time

export class AuthClient {
    private static authInstance: AuthClient;
    public auth: any;
    private constructor() {
        this.auth = authenticate({
            // create folder dist in root directory and add credentials file which can be downlaoded from google cloud console
            // here i am using service account
            keyfilePath: path.join(__dirname, "../credentials.json"), 
            scopes: SCOPES,
        });
    }
    public static getInstance(): AuthClient {
        if (!AuthClient.authInstance) {
            AuthClient.authInstance = new AuthClient();
        }
        return AuthClient.authInstance;
    }
}
