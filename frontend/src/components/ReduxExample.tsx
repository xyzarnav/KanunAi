"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Example component showing how to use Redux
export function ReduxExample() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  return (
    <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Redux State Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">Current State:</h3>
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md text-sm">
            <p><strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}</p>
            <p><strong>Loading:</strong> {isLoading ? "Yes" : "No"}</p>
            <p><strong>User:</strong> {user ? user.name : "None"}</p>
            <p><strong>Error:</strong> {error || "None"}</p>
          </div>
        </div>
        
        <div className="text-xs text-slate-400">
          This component demonstrates how to access Redux state using useAppSelector hook.
          The state is automatically updated when authentication actions are dispatched.
        </div>
      </CardContent>
    </Card>
  );
}
