'use server'

import os from 'os'

export async function getLocalIp() {
    // Only attempt to find local IP in development
    if (process.env.NODE_ENV === 'production') return null;

    try {
        const interfaces = os.networkInterfaces()
        for (const name of Object.keys(interfaces)) {
            for (const interfaceInfo of interfaces[name] || []) {
                // Return the first internal IPv4 address found
                if (!interfaceInfo.internal && interfaceInfo.family === 'IPv4') {
                    return interfaceInfo.address
                }
            }
        }
    } catch (e) {
        console.error("Failed to get local IP:", e)
    }
    return null;
}
