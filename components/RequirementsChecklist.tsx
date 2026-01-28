"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface ChecklistCategory {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  items: ChecklistItem[];
}

interface RequirementsChecklistProps {
  checklist: ChecklistCategory[];
}

export function RequirementsChecklist({ checklist }: RequirementsChecklistProps) {
  const totalItems = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checklist.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.completed).length,
    0
  );
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Committee Requirements Checklist</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedItems}/{totalItems} completed ({completionPercentage.toFixed(0)}%)
          </span>
        </CardTitle>
        <CardDescription>
          Ensure all required items are completed before submitting to the Canton Tokenomics Committee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {checklist.map((category) => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2">
              {category.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <h3 className="font-semibold text-lg">
                {category.label}
                {category.required && (
                  <span className="ml-2 text-xs text-destructive">* Required</span>
                )}
              </h3>
            </div>
            <div className="ml-7 space-y-2">
              {category.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={item.completed} disabled />
                  <label
                    className={cn(
                      "text-sm",
                      item.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        {completionPercentage === 100 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200">
              All requirements completed! Your report is ready for committee submission.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
