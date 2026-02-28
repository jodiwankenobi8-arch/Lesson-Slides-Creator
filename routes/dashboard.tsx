/**
 * Dashboard Home
 * 
 * Primary teacher workspace with:
 * - Welcome message
 * - Quick create action
 * - Recent lessons
 * - Quick actions
 */

import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { PageLayout } from '../components/page-layout';
import { PageHeader } from '../components/page-header';
import { 
  Plus, 
  FileText, 
  BookCheck,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Lesson, getStatusColor, getStatusLabel, formatDate } from '../types/lesson-types';
import { GinghamAccent, AppleIcon, PolkaDotPanel } from '../components/decorative-patterns';

// Mock data - will be replaced with real data from database
const recentLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'UFLI 82 Day 2 + Savvas U3 W2 D4',
    subject: 'ELA',
    status: 'ready',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    curriculumSummary: 'UFLI 82 Day 2 • Savvas U3 W2 D4',
    duration: '30 min',
    sources: 'UFLI + Savvas',
    setupComplete: true,
    materialsUploaded: true,
    materialCount: 3,
    extractionComplete: true,
    slidesGenerated: true,
    slideCount: 18,
  },
  {
    id: 'lesson-2',
    title: 'UFLI 81 Day 1',
    subject: 'ELA',
    status: 'taught',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    curriculumSummary: 'UFLI 81 Day 1',
    duration: '30 min',
    sources: 'UFLI',
    setupComplete: true,
    materialsUploaded: true,
    materialCount: 2,
    extractionComplete: true,
    slidesGenerated: true,
    slideCount: 15,
  },
  {
    id: 'lesson-3',
    title: 'Savvas U3 W1 D5 Review',
    subject: 'ELA',
    status: 'draft',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    curriculumSummary: 'Savvas U3 W1 D5',
    duration: '30 min',
    sources: 'Savvas',
    setupComplete: true,
    materialsUploaded: false,
    materialCount: 0,
    extractionComplete: false,
    slidesGenerated: false,
  },
];

export default function Dashboard() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  
  // Get today's date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Get last active lesson (most recently updated)
  const lastLesson = recentLessons.length > 0 
    ? [...recentLessons].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0]
    : null;

  return (
    <PageLayout>
      <PageHeader 
        title={`${greeting}, Jodie!`}
        description="✨ Ready to build something wonderful today? ✨"
        action={
          <Link to="/lessons/new">
            <Button size="lg" className="bg-[#C84C4C] hover:bg-[#B43D3D] text-white font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              🍎 Create New Lesson
            </Button>
          </Link>
        }
      />

      <div className="mb-6 text-base text-right" style={{ color: '#999999' }}>
        📅 {today}
      </div>

      {/* Continue Last Lesson (if exists) */}
      {lastLesson && lastLesson.status !== 'taught' && (
        <Card className="mb-6 border-2 overflow-hidden" style={{ borderColor: '#CFE3F5', backgroundColor: '#F8FBFF' }}>
          <GinghamAccent />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: '#1F2A44' }}>Continue where you left off</p>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1F2A44' }}>
                  {lastLesson.title}
                </h3>
                <div className="flex items-center gap-3 text-sm" style={{ color: '#666666' }}>
                  <span>{lastLesson.curriculumSummary}</span>
                  <span>•</span>
                  <span>{lastLesson.duration}</span>
                </div>
              </div>
              <Link to={`/lessons/${lastLesson.id}`}>
                <Button size="lg" className="bg-[#C84C4C] hover:bg-[#B43D3D]">
                  Continue Lesson
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Lessons */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Lessons</h2>
            <Link to="/lessons">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentLessons.map((lesson) => (
              <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <GinghamAccent />
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate" style={{ color: '#1F2A44' }}>
                          {lesson.title}
                        </h3>
                        <p className="text-sm" style={{ color: '#666666' }}>
                          {lesson.curriculumSummary}
                        </p>
                      </div>
                      <Badge className={getStatusColor(lesson.status)}>
                        {getStatusLabel(lesson.status)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm" style={{ color: '#999999' }}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(lesson.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration}
                      </div>
                      {lesson.slidesGenerated && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {lesson.slideCount} slides
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {recentLessons.length === 0 && (
              <PolkaDotPanel variant="pink">
                <div className="text-center py-8">
                  <AppleIcon size={64} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#1F2A44', fontFamily: "'Montserrat', 'Nunito', sans-serif" }}>
                    Your lessons will appear here
                  </h3>
                  <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#666666' }}>
                    Once you create your first lesson, you'll see it listed here with
                    status, date, and quick access to continue editing.
                  </p>
                  <Link to="/lessons/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Lesson
                    </Button>
                  </Link>
                </div>
              </PolkaDotPanel>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2A44', fontFamily: "'Montserrat', 'Nunito', sans-serif" }}>Quick Actions</h2>
          
          <div className="space-y-3">
            <Link to="/templates">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <GinghamAccent />
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F7DDE2' }}>
                      <FileText className="w-5 h-5" style={{ color: '#C84C4C' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#1F2A44' }}>Manage Templates</h3>
                      <p className="text-xs" style={{ color: '#999999' }}>View and update your slide templates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/diagnostics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <GinghamAccent />
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E7' }}>
                      <BookCheck className="w-5 h-5" style={{ color: '#6FA86B' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#1F2A44' }}>System Diagnostics</h3>
                      <p className="text-xs" style={{ color: '#999999' }}>Troubleshooting and maintenance tools</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="overflow-hidden" style={{ backgroundColor: '#F8FBFF', borderColor: '#CFE3F5' }}>
              <GinghamAccent />
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CFE3F5' }}>
                    <BookCheck className="w-5 h-5" style={{ color: '#1F2A44' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#1F2A44' }}>Standards Aligned</h3>
                    <p className="text-xs" style={{ color: '#999999' }}>Florida B.E.S.T. Standards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}