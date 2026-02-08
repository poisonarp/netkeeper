import { NotificationSettings, SMTPConfig, DiscordConfig, GotifyConfig, NtfyConfig } from '../types.ts';

export interface AlertPayload {
  title: string;
  message: string;
  deviceName: string;
  ipAddress: string;
  alertType: 'offline' | 'online' | 'high_latency' | 'warning';
  timestamp: string;
  latency?: number;
}

const STORAGE_KEY = 'notificationSettings';
const COOLDOWN_KEY = 'notificationCooldowns';

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
  smtp: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromAddress: '',
    toAddresses: []
  },
  discord: {
    enabled: false,
    webhookUrl: '',
    username: 'NetKeeper',
    avatarUrl: ''
  },
  gotify: {
    enabled: false,
    serverUrl: '',
    appToken: '',
    priority: 5
  },
  ntfy: {
    enabled: false,
    serverUrl: 'https://ntfy.sh',
    topic: '',
    priority: 3
  },
  alertOnOffline: true,
  alertOnBackOnline: true,
  alertOnHighLatency: false,
  highLatencyThreshold: 200,
  cooldownMinutes: 5
};

// Load settings from localStorage
export function loadNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultNotificationSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load notification settings:', e);
  }
  return defaultNotificationSettings;
}

// Save settings to localStorage
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

// Check cooldown to prevent notification spam
function isOnCooldown(deviceId: string, alertType: string, cooldownMinutes: number): boolean {
  try {
    const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
    const key = `${deviceId}_${alertType}`;
    const lastAlert = cooldowns[key];
    
    if (lastAlert) {
      const elapsed = Date.now() - lastAlert;
      return elapsed < cooldownMinutes * 60 * 1000;
    }
  } catch (e) {
    console.error('Cooldown check failed:', e);
  }
  return false;
}

// Set cooldown after sending notification
function setCooldown(deviceId: string, alertType: string): void {
  try {
    const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
    cooldowns[`${deviceId}_${alertType}`] = Date.now();
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
  } catch (e) {
    console.error('Failed to set cooldown:', e);
  }
}

// Get emoji for alert type
function getAlertEmoji(alertType: string): string {
  switch (alertType) {
    case 'offline': return '🔴';
    case 'online': return '🟢';
    case 'high_latency': return '🟡';
    case 'warning': return '⚠️';
    default: return '📡';
  }
}

// Get color for Discord embed
function getAlertColor(alertType: string): number {
  switch (alertType) {
    case 'offline': return 0xff0000; // Red
    case 'online': return 0x00ff00; // Green
    case 'high_latency': return 0xffaa00; // Orange
    case 'warning': return 0xffff00; // Yellow
    default: return 0x0099ff; // Blue
  }
}

// Send Discord webhook notification
async function sendDiscordNotification(config: DiscordConfig, payload: AlertPayload): Promise<boolean> {
  if (!config.enabled || !config.webhookUrl) return false;

  try {
    const embed = {
      title: `${getAlertEmoji(payload.alertType)} ${payload.title}`,
      description: payload.message,
      color: getAlertColor(payload.alertType),
      fields: [
        { name: 'Device', value: payload.deviceName, inline: true },
        { name: 'IP Address', value: payload.ipAddress, inline: true },
        ...(payload.latency !== undefined ? [{ name: 'Latency', value: `${payload.latency}ms`, inline: true }] : [])
      ],
      timestamp: payload.timestamp,
      footer: { text: 'NetKeeper Pro' }
    };

    const body: any = {
      username: config.username || 'NetKeeper',
      embeds: [embed]
    };

    if (config.avatarUrl) {
      body.avatar_url = config.avatarUrl;
    }

    if (config.mentionRoleId) {
      body.content = `<@&${config.mentionRoleId}>`;
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    return response.ok;
  } catch (e) {
    console.error('Discord notification failed:', e);
    return false;
  }
}

// Send Gotify notification
async function sendGotifyNotification(config: GotifyConfig, payload: AlertPayload): Promise<boolean> {
  if (!config.enabled || !config.serverUrl || !config.appToken) return false;

  try {
    const url = `${config.serverUrl.replace(/\/$/, '')}/message?token=${config.appToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${getAlertEmoji(payload.alertType)} ${payload.title}`,
        message: `${payload.message}\n\nDevice: ${payload.deviceName}\nIP: ${payload.ipAddress}${payload.latency !== undefined ? `\nLatency: ${payload.latency}ms` : ''}`,
        priority: config.priority,
        extras: {
          'client::notification': {
            click: { url: window.location.origin }
          }
        }
      })
    });

    return response.ok;
  } catch (e) {
    console.error('Gotify notification failed:', e);
    return false;
  }
}

// Send Ntfy notification
async function sendNtfyNotification(config: NtfyConfig, payload: AlertPayload): Promise<boolean> {
  if (!config.enabled || !config.topic) return false;

  try {
    const url = `${config.serverUrl.replace(/\/$/, '')}/${config.topic}`;
    
    const headers: Record<string, string> = {
      'Title': `${getAlertEmoji(payload.alertType)} ${payload.title}`,
      'Priority': String(config.priority),
      'Tags': payload.alertType === 'offline' ? 'rotating_light' : payload.alertType === 'online' ? 'white_check_mark' : 'warning'
    };

    if (config.username && config.password) {
      headers['Authorization'] = 'Basic ' + btoa(`${config.username}:${config.password}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: `${payload.message}\n\nDevice: ${payload.deviceName}\nIP: ${payload.ipAddress}${payload.latency !== undefined ? `\nLatency: ${payload.latency}ms` : ''}`
    });

    return response.ok;
  } catch (e) {
    console.error('Ntfy notification failed:', e);
    return false;
  }
}

// Send SMTP notification via backend API
async function sendSMTPNotification(config: SMTPConfig, payload: AlertPayload): Promise<boolean> {
  if (!config.enabled || !config.host || config.toAddresses.length === 0) return false;

  try {
    // Send to backend for SMTP delivery
    const response = await fetch('/api/notifications/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        payload: {
          subject: `${getAlertEmoji(payload.alertType)} NetKeeper: ${payload.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: ${payload.alertType === 'offline' ? '#dc2626' : payload.alertType === 'online' ? '#16a34a' : '#ea580c'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">${getAlertEmoji(payload.alertType)} ${payload.title}</h2>
              </div>
              <div style="background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; margin-bottom: 20px;">${payload.message}</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Device</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; text-align: right;">${payload.deviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #94a3b8;">IP Address</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; text-align: right; font-family: monospace;">${payload.ipAddress}</td>
                  </tr>
                  ${payload.latency !== undefined ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #94a3b8;">Latency</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #334155; text-align: right;">${payload.latency}ms</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Time</td>
                    <td style="padding: 8px 0; text-align: right;">${new Date(payload.timestamp).toLocaleString()}</td>
                  </tr>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Sent by NetKeeper Pro</p>
              </div>
            </div>
          `,
          text: `${payload.title}\n\n${payload.message}\n\nDevice: ${payload.deviceName}\nIP: ${payload.ipAddress}${payload.latency !== undefined ? `\nLatency: ${payload.latency}ms` : ''}\nTime: ${new Date(payload.timestamp).toLocaleString()}`
        }
      })
    });

    return response.ok;
  } catch (e) {
    console.error('SMTP notification failed:', e);
    return false;
  }
}

// Main function to send alert through all enabled channels
export async function sendAlert(
  deviceId: string,
  payload: AlertPayload,
  settings?: NotificationSettings
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const config = settings || loadNotificationSettings();
  
  // Check cooldown
  if (isOnCooldown(deviceId, payload.alertType, config.cooldownMinutes)) {
    console.log(`Alert for ${deviceId} is on cooldown`);
    return { success: false, results: { cooldown: true } };
  }

  const results: Record<string, boolean> = {};
  let anySuccess = false;

  // Send to all enabled channels in parallel
  const promises: Promise<void>[] = [];

  if (config.discord.enabled) {
    promises.push(
      sendDiscordNotification(config.discord, payload).then(ok => {
        results.discord = ok;
        if (ok) anySuccess = true;
      })
    );
  }

  if (config.gotify.enabled) {
    promises.push(
      sendGotifyNotification(config.gotify, payload).then(ok => {
        results.gotify = ok;
        if (ok) anySuccess = true;
      })
    );
  }

  if (config.ntfy.enabled) {
    promises.push(
      sendNtfyNotification(config.ntfy, payload).then(ok => {
        results.ntfy = ok;
        if (ok) anySuccess = true;
      })
    );
  }

  if (config.smtp.enabled) {
    promises.push(
      sendSMTPNotification(config.smtp, payload).then(ok => {
        results.smtp = ok;
        if (ok) anySuccess = true;
      })
    );
  }

  await Promise.all(promises);

  // Set cooldown if any notification was sent
  if (anySuccess) {
    setCooldown(deviceId, payload.alertType);
  }

  return { success: anySuccess, results };
}

// Test a specific notification channel
export async function testNotification(
  channel: 'smtp' | 'discord' | 'gotify' | 'ntfy',
  config: SMTPConfig | DiscordConfig | GotifyConfig | NtfyConfig
): Promise<boolean> {
  const testPayload: AlertPayload = {
    title: 'Test Notification',
    message: 'This is a test notification from NetKeeper Pro. If you see this, your notification channel is configured correctly!',
    deviceName: 'Test Device',
    ipAddress: '192.168.1.1',
    alertType: 'warning',
    timestamp: new Date().toISOString()
  };

  switch (channel) {
    case 'discord':
      return sendDiscordNotification(config as DiscordConfig, testPayload);
    case 'gotify':
      return sendGotifyNotification(config as GotifyConfig, testPayload);
    case 'ntfy':
      return sendNtfyNotification(config as NtfyConfig, testPayload);
    case 'smtp':
      return sendSMTPNotification(config as SMTPConfig, testPayload);
    default:
      return false;
  }
}

// Helper to create common alert payloads
export function createOfflineAlert(deviceName: string, ipAddress: string): AlertPayload {
  return {
    title: 'Device Offline',
    message: `${deviceName} (${ipAddress}) is no longer responding to network checks.`,
    deviceName,
    ipAddress,
    alertType: 'offline',
    timestamp: new Date().toISOString()
  };
}

export function createOnlineAlert(deviceName: string, ipAddress: string): AlertPayload {
  return {
    title: 'Device Back Online',
    message: `${deviceName} (${ipAddress}) is now responding again.`,
    deviceName,
    ipAddress,
    alertType: 'online',
    timestamp: new Date().toISOString()
  };
}

export function createHighLatencyAlert(deviceName: string, ipAddress: string, latency: number): AlertPayload {
  return {
    title: 'High Latency Detected',
    message: `${deviceName} (${ipAddress}) is experiencing high latency.`,
    deviceName,
    ipAddress,
    alertType: 'high_latency',
    latency,
    timestamp: new Date().toISOString()
  };
}
