import { authenticate } from "@google-cloud/local-auth";
import path from 'path';
const SCOPES = ["https://www.googleapis.com/auth/tasks"];


export class AuthClient {
    private static authInstance: AuthClient;
    public auth: any;
    private constructor() {
        this.auth = authenticate({
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
