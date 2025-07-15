import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, NotebookPen, BookOpenCheck } from "lucide-react";

export default function TeacherDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="rounded-full w-10 h-10 bg-gray-200" />
      </div>

      {/* Progress Overview */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-2">Progress Overview</h2>
        <p className="text-sm text-muted-foreground">
          🔵 80% Schedule Completed · 🔴 10 Missed · ⚠️ 5 No Diary
        </p>
      </div>

      {/* Quick Access Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-6">
            <CalendarDays className="mx-auto mb-2 w-6 h-6 text-primary" />
            <h3 className="text-md font-medium">Schedule</h3>
            <p className="text-sm text-muted-foreground mb-2">View or register classes</p>
            <Button variant="outline" className="w-full">Open</Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <NotebookPen className="mx-auto mb-2 w-6 h-6 text-primary" />
            <h3 className="text-md font-medium">Class Notes</h3>
            <p className="text-sm text-muted-foreground mb-2">Write and submit notes</p>
            <Button variant="outline" className="w-full">Open</Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <BookOpenCheck className="mx-auto mb-2 w-6 h-6 text-primary" />
            <h3 className="text-md font-medium">Diary</h3>
            <p className="text-sm text-muted-foreground mb-2">Write student diaries</p>
            <Button variant="outline" className="w-full">Open</Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gray-100 p-4 rounded-xl">
        <h2 className="text-md font-semibold mb-1">💬 AI Suggestions</h2>
        <ul className="text-sm text-muted-foreground list-disc list-inside">
          <li>You haven’t written a note for 7/2 class</li>
          <li>3 students don’t have a diary for last week</li>
        </ul>
      </div>
    </div>
  );
}
