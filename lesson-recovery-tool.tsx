/**
 * Lesson Recovery Tool
 * Finds and repairs broken or missing lessons
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Search, Wrench, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN
import { saveLesson } from '../utils/supabase-lessons';
import { toast } from 'sonner';

interface RecoveryResult {
  found: boolean;
  key?: string;
  data?: any;
  issues?: string[];
  repaired?: boolean;
}

export function LessonRecoveryTool() {
  const [searchTerm, setSearchTerm] = useState('ufli 34');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);

  const searchAndRepair = async () => {
    setSearching(true);
    setResult(null);

    try {
      console.log('🔍 Searching for lesson:', searchTerm);
      
      // Get all database entries
      const response = await api.debugAllKeys();

      if (!response.ok) {
        throw new Error('Failed to fetch database entries');
      }

      const dbResult = await response.json();
      const allEntries = dbResult.entries || [];
      
      console.log('📊 Total database entries:', allEntries.length);
      
      // Search for the lesson by name or ID
      const searchLower = searchTerm.toLowerCase();
      const matchingEntries = allEntries.filter((entry: any) => {
        if (!entry.key || !entry.key.startsWith('lesson:')) return false;
        
        const name = entry.value?.name?.toLowerCase() || '';
        const id = entry.value?.id?.toLowerCase() || '';
        const key = entry.key.toLowerCase();
        
        return name.includes(searchLower) || id.includes(searchLower) || key.includes(searchLower);
      });

      console.log('✅ Found matching entries:', matchingEntries.length);

      if (matchingEntries.length === 0) {
        setResult({
          found: false,
          issues: ['Lesson not found in database']
        });
        toast.error('Lesson not found in database');
        return;
      }

      // Analyze each matching entry
      const issues: string[] = [];
      let bestEntry = matchingEntries[0];
      let needsRepair = false;

      for (const entry of matchingEntries) {
        console.log('🔎 Checking entry:', entry.key);
        
        const lesson = entry.value;
        
        // Check for issues
        if (!lesson.id) {
          issues.push(`Missing ID field (key: ${entry.key})`);
          needsRepair = true;
        }
        if (!lesson.name) {
          issues.push(`Missing name field (key: ${entry.key})`);
          needsRepair = true;
        }
        if (!lesson.createdAt) {
          issues.push(`Missing createdAt field (key: ${entry.key})`);
          needsRepair = true;
        }
        if (!lesson.updatedAt) {
          issues.push(`Missing updatedAt field (key: ${entry.key})`);
          needsRepair = true;
        }

        // Keep the entry with the most recent update
        if (lesson.updatedAt && bestEntry.value.updatedAt) {
          if (new Date(lesson.updatedAt) > new Date(bestEntry.value.updatedAt)) {
            bestEntry = entry;
          }
        }
      }

      console.log('🎯 Best entry found:', bestEntry.key);
      console.log('📋 Issues detected:', issues);

      // If we found multiple entries, that's also an issue
      if (matchingEntries.length > 1) {
        issues.push(`Duplicate entries found (${matchingEntries.length} total)`);
        needsRepair = true;
      }

      // Attempt to repair if needed
      if (needsRepair) {
        console.log('🔧 Attempting repair...');
        
        const lesson = bestEntry.value;
        const now = new Date().toISOString();
        
        // Fix missing fields
        const repairedLesson = {
          ...lesson,
          id: lesson.id || `lesson-${Date.now()}-recovered`,
          name: lesson.name || searchTerm,
          createdAt: lesson.createdAt || now,
          updatedAt: now,
          data: lesson.data || {}
        };

        console.log('💾 Saving repaired lesson...');
        
        // Save the repaired lesson
        await saveLesson(repairedLesson);
        
        // Delete duplicate entries if any
        if (matchingEntries.length > 1) {
          console.log('🗑️ Cleaning up duplicates...');
          
          for (const entry of matchingEntries) {
            if (entry.key !== `lesson:${repairedLesson.id}`) {
              try {
                await api.kvDel(entry.key);
                console.log('✅ Deleted duplicate:', entry.key);
              } catch (error) {
                console.warn('⚠️ Failed to delete duplicate:', entry.key, error);
              }
            }
          }
        }

        setResult({
          found: true,
          key: `lesson:${repairedLesson.id}`,
          data: repairedLesson,
          issues,
          repaired: true
        });

        toast.success('Lesson found and repaired! Refresh the page to see it.');
      } else {
        // No issues found
        setResult({
          found: true,
          key: bestEntry.key,
          data: bestEntry.value,
          issues: [],
          repaired: false
        });

        toast.success('Lesson found with no issues');
      }

    } catch (error) {
      console.error('❌ Recovery failed:', error);
      toast.error('Recovery failed: ' + (error as Error).message);
      setResult({
        found: false,
        issues: [(error as Error).message]
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Lesson Recovery Tool
        </CardTitle>
        <CardDescription>
          Find and repair missing or broken lessons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter lesson name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && searchAndRepair()}
            />
          </div>
          <Button onClick={searchAndRepair} disabled={searching || !searchTerm}>
            {searching ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search & Repair
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            {result.found ? (
              <>
                <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
                  <CheckCircle className="w-5 h-5" />
                  Lesson Found!
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Key:</span> 
                    <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                      {result.key}
                    </code>
                  </div>
                  
                  <div>
                    <span className="font-semibold">Name:</span> {result.data?.name}
                  </div>
                  
                  <div>
                    <span className="font-semibold">ID:</span> {result.data?.id}
                  </div>
                  
                  <div>
                    <span className="font-semibold">Last Updated:</span> {
                      result.data?.updatedAt 
                        ? new Date(result.data.updatedAt).toLocaleString() 
                        : 'Unknown'
                    }
                  </div>

                  {result.issues && result.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-semibold mb-2">
                        {result.repaired ? 'Issues Fixed:' : 'Issues Found:'}
                      </div>
                      <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--ao-red)' }}>
                        {result.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.repaired && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Lesson has been repaired!
                      </div>
                      <p className="text-green-600 text-xs mt-1">
                        Please refresh the page to see the restored lesson in "My Lessons"
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-red-600 font-semibold mb-3">
                  <AlertCircle className="w-5 h-5" />
                  Lesson Not Found
                </div>
                
                {result.issues && result.issues.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {result.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
                
                <p className="text-sm text-gray-500 mt-3">
                  The lesson may have been permanently deleted or never saved.
                </p>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p className="font-semibold mb-1">This tool will:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Search the database for matching lessons</li>
            <li>Check for missing or invalid fields</li>
            <li>Repair data issues automatically</li>
            <li>Remove duplicate entries</li>
            <li>Restore the lesson to working condition</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}