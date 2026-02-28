import { getAllLessons, deleteLesson } from './supabase-lessons';
import { normalizeLessons } from './data-guards';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

/**
 * Delete all lessons from database except the specified lesson ID
 * Uses direct database access to ensure keys are properly handled
 */
export async function deleteAllLessonsExcept(keepLessonId: string): Promise<{ deleted: number; kept: string[] }> {
  try {
    // Get all database entries with their keys
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-0d810c1e/kv/debug/all`,
      {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch database entries');
    }

    const data = await response.json();
    const allEntries = data.entries || [];
    
    console.log(`Found ${allEntries.length} total entries in database`);
    
    // Normalize and find entries to delete
    const entriesToDelete: string[] = [];
    let keptKeys: string[] = [];
    
    for (const entry of allEntries) {
      const normalized = normalizeLessons([{ ...entry.value }])[0];
      
      if (normalized.id === keepLessonId) {
        console.log(`✅ Keeping entry with key: ${entry.key}`);
        keptKeys.push(entry.key);
      } else {
        console.log(`🗑️ Will delete entry with key: ${entry.key}`);
        entriesToDelete.push(entry.key);
      }
    }
    
    console.log(`Deleting ${entriesToDelete.length} entries...`);
    
    // Delete each entry by its database key
    for (const key of entriesToDelete) {
      try {
        await fetch(
          `${supabaseUrl}/functions/v1/make-server-0d810c1e/kv/del`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ key }),
          }
        );
        console.log(`✅ Deleted: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${key}:`, error);
      }
    }
    
    return {
      deleted: entriesToDelete.length,
      kept: keptKeys
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}