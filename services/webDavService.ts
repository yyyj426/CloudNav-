import { Category, LinkItem, WebDavConfig } from "../types";
import { Buffer } from 'buffer';

// Ensure Buffer is available globally if needed, though modern browsers have btoa
const encodeAuth = (user: string, pass: string) => {
    return btoa(`${user}:${pass}`);
};

export const checkWebDavConnection = async (config: WebDavConfig): Promise<boolean> => {
    try {
        const response = await fetch(config.url, {
            method: 'PROPFIND', // Standard WebDAV check
            headers: {
                'Authorization': `Basic ${encodeAuth(config.username, config.password)}`,
                'Depth': '0'
            }
        });
        // 207 Multi-Status is typical for WebDAV, 200 OK is also fine
        return response.status === 207 || response.status === 200;
    } catch (error) {
        console.error("WebDAV Connection Check Failed:", error);
        return false;
    }
};

export const uploadBackup = async (config: WebDavConfig, data: { links: LinkItem[], categories: Category[] }): Promise<boolean> => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const filename = 'cloudnav_backup.json';
        const targetUrl = config.url.endsWith('/') ? `${config.url}${filename}` : `${config.url}/${filename}`;

        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${encodeAuth(config.username, config.password)}`,
                'Content-Type': 'application/json'
            },
            body: jsonString
        });

        return response.ok || response.status === 201 || response.status === 204;
    } catch (error) {
        console.error("WebDAV Upload Failed:", error);
        return false;
    }
};

export const downloadBackup = async (config: WebDavConfig): Promise<{ links: LinkItem[], categories: Category[] } | null> => {
    try {
        const filename = 'cloudnav_backup.json';
        const targetUrl = config.url.endsWith('/') ? `${config.url}${filename}` : `${config.url}/${filename}`;

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${encodeAuth(config.username, config.password)}`
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data.links) && Array.isArray(data.categories)) {
            return data as { links: LinkItem[], categories: Category[] };
        }
        return null;
    } catch (error) {
        console.error("WebDAV Download Failed:", error);
        return null;
    }
};