/**
 * Google Drive Sync Service
 * Syncs all Jarify app data to Google Drive's appdata folder
 * so data is available across all devices where the user signs in.
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const BACKUP_FILENAME = 'jarify_backup.json';

// All localStorage keys that contain user data to sync
const SYNC_KEYS = [
  'jarify_jars',
  'jarify_categories',
  'jarify_notes',
  'jarify_darkMode',
  'jarify_folders',
  'jarify_expenses',
  'jarify_expense_categories',
  'jarify_incomes',
  'jarify_expense_mode',
  'jarify_starred_transactions',
  'jarify_accounts',
  'jarify_recurring_expenses',
  'jarify_spending_goals',
  'jarify_bill_reminders',
  'jarify_budget_settings',
  'jarify_currency_settings',
  'jarify_split_expenses',
];

export interface SyncData {
  version: number;
  timestamp: string;
  deviceId: string;
  data: Record<string, string | null>;
}

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('jarify_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('jarify_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Collect all app data from localStorage into a sync payload
 */
export const collectSyncData = (): SyncData => {
  const data: Record<string, string | null> = {};

  SYNC_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      data[key] = value;
    }
  });

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    data,
  };
};

/**
 * Apply sync data from Drive to localStorage
 */
export const applySyncData = (syncData: SyncData): void => {
  Object.entries(syncData.data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, value);
    }
  });
  localStorage.setItem('jarify_last_sync', syncData.timestamp);
};

/**
 * Find the backup file in Google Drive appdata folder
 */
const findBackupFile = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Drive API error finding file:', error);
      return null;
    }

    const result = await response.json();
    if (result.files && result.files.length > 0) {
      return result.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding backup file:', error);
    return null;
  }
};

/**
 * Upload data to Google Drive appdata folder
 */
export const uploadToDrive = async (accessToken: string): Promise<boolean> => {
  try {
    const syncData = collectSyncData();
    const fileContent = JSON.stringify(syncData);
    const existingFileId = await findBackupFile(accessToken);

    if (existingFileId) {
      // Update existing file
      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Drive API error updating file:', error);
        return false;
      }
    } else {
      // Create new file using multipart upload
      const metadata = {
        name: BACKUP_FILENAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

      const boundary = '---jarify_boundary';
      const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        fileContent,
        `--${boundary}--`,
      ].join('\r\n');

      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Drive API error creating file:', error);
        return false;
      }
    }

    localStorage.setItem('jarify_last_sync', new Date().toISOString());
    console.log('Data uploaded to Google Drive successfully');
    return true;
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return false;
  }
};

/**
 * Download data from Google Drive appdata folder
 */
export const downloadFromDrive = async (accessToken: string): Promise<SyncData | null> => {
  try {
    const fileId = await findBackupFile(accessToken);
    if (!fileId) {
      console.log('No backup file found in Google Drive');
      return null;
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Drive API error downloading file:', error);
      return null;
    }

    const syncData: SyncData = await response.json();
    console.log('Data downloaded from Google Drive:', syncData.timestamp);
    return syncData;
  } catch (error) {
    console.error('Error downloading from Drive:', error);
    return null;
  }
};

/**
 * Full sync: download from Drive, merge with local, upload back
 */
export const performFullSync = async (accessToken: string): Promise<{ success: boolean; direction: 'uploaded' | 'downloaded' | 'merged' | 'none' }> => {
  try {
    // Download existing backup
    const remoteData = await downloadFromDrive(accessToken);
    const lastLocalSync = localStorage.getItem('jarify_last_sync');

    if (!remoteData) {
      // No remote data exists, upload local data
      const uploaded = await uploadToDrive(accessToken);
      return { success: uploaded, direction: 'uploaded' };
    }

    const remoteTime = new Date(remoteData.timestamp).getTime();
    const localTime = lastLocalSync ? new Date(lastLocalSync).getTime() : 0;

    if (remoteTime > localTime) {
      // Remote is newer, apply remote data then upload merged
      applySyncData(remoteData);
      const uploaded = await uploadToDrive(accessToken);
      return { success: uploaded, direction: 'downloaded' };
    } else {
      // Local is newer or same, upload local data
      const uploaded = await uploadToDrive(accessToken);
      return { success: uploaded, direction: 'uploaded' };
    }
  } catch (error) {
    console.error('Full sync error:', error);
    return { success: false, direction: 'none' };
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = (): string | null => {
  return localStorage.getItem('jarify_last_sync');
};
