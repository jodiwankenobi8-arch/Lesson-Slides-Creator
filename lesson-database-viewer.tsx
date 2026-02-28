/**
 * Database Viewer Component
 * Quick diagnostic tool to see all lessons in the database
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Search, RefreshCw, Database } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
import { api } from '../../utils/api';  // ✅ ONLY ALLOWED API PATTERN
import { toast } from 'sonner';

interface DBEntry {
  key: string;
  value: any;
}

export function LessonDatabaseViewer() {
  const [entries, setEntries] = useState<DBEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAllEntries = async () => {
    setLoading(true);
    try {
      const response = await api.debugAllKeys();

      if (!response.ok) {
        throw new Error('Failed to fetch database entries');
      }

      const result = await response.json();
      const allEntries = result.entries || [];
      
      // Filter to only lesson entries
      const lessonEntries = allEntries.filter((entry: any) => 
        entry.key && entry.key.startsWith('lesson:')
      );
      
      setEntries(lessonEntries);
      console.log('📊 Database entries loaded:', lessonEntries);
    } catch (error) {
      console.error('Error loading database:', error);
      toast.error('Failed to load database entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEntries();
  }, []);

  const filteredEntries = entries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    const keyMatch = entry.key.toLowerCase().includes(searchLower);
    const nameMatch = entry.value?.name?.toLowerCase().includes(searchLower);
    const idMatch = entry.value?.id?.toLowerCase().includes(searchLower);
    return keyMatch || nameMatch || idMatch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Viewer
        </CardTitle>
        <CardDescription>
          View all lesson entries in the database (including all key formats)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by key, name, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <Button onClick={loadAllEntries} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Found {filteredEntries.length} entries (total: {entries.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEntries.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs mb-1 break-all" style={{ color: 'var(--ao-navy)' }}>
                      {entry.key}
                    </div>
                    <div className="font-semibold text-sm">
                      {entry.value?.name || 'Unnamed Lesson'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {entry.value?.id || 'No ID'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated: {entry.value?.updatedAt ? new Date(entry.value.updatedAt).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {entry.value?.data?.phonicsConcept || 'No concept'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}