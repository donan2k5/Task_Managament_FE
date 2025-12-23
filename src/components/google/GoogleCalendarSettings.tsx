import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, RefreshCw, Unlink, Calendar, Wifi, WifiOff, Play } from "lucide-react";
import { formatLastSyncTime } from "@/utils/syncHelpers";

export const GoogleCalendarSettings = () => {
  const {
    googleStatus,
    syncStatus,
    isGoogleConnected,
    isSyncEnabled,
    isLoading,
    isSyncLoading,
    connectGoogle,
    disconnectGoogle,
  } = useGoogleAuth();

  const {
    isLoading: isSyncOperating,
    initializeSync,
    syncAllTasks,
    syncFromGoogle,
    disconnectSync,
  } = useCalendarSync();

  const handleSyncNow = async () => {
    await syncAllTasks();
    await syncFromGoogle();
  };

  // Not connected state
  if (!isGoogleConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to sync tasks bidirectionally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4 max-w-sm">
              Connect your Google account to sync all your scheduled tasks to a dedicated "Axis" calendar in Google Calendar.
            </p>
            <Button
              onClick={connectGoogle}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Connect Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Manage your Google Calendar sync settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-green-700">Connected</div>
              <div className="text-sm text-gray-600">{googleStatus?.email}</div>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        </div>

        {/* Sync Status Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Calendar</span>
            <span className="font-medium">Axis</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Auto-Sync</span>
            <Badge variant={isSyncEnabled ? "default" : "secondary"}>
              {isSyncEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Real-time Sync</span>
            <div className="flex items-center gap-2">
              {syncStatus?.webhookActive ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-yellow-500" />
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Inactive
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Last Synced</span>
            <span className="text-sm text-gray-500">
              {formatLastSyncTime(googleStatus?.lastSyncedAt)}
            </span>
          </div>
        </div>

        {/* Warning if auto-sync is not enabled */}
        {!isSyncEnabled && (
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-medium text-orange-800">Auto-sync is disabled</p>
              <p className="text-orange-700 mt-1">
                Tasks won't automatically sync to Google Calendar. Click "Enable Auto-Sync" to activate.
              </p>
              <Button
                size="sm"
                onClick={initializeSync}
                disabled={isSyncOperating || isSyncLoading}
                className="mt-3 gap-2"
              >
                {isSyncOperating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Enable Auto-Sync
              </Button>
            </div>
          </div>
        )}

        {/* Warning if webhook is not active */}
        {isSyncEnabled && !syncStatus?.webhookActive && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Real-time sync is not active</p>
              <p className="text-yellow-700 mt-1">
                Changes made in Google Calendar may be delayed. Click "Sync Now" to manually pull updates.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {isSyncEnabled && (
            <Button
              variant="outline"
              onClick={handleSyncNow}
              disabled={isSyncOperating || isSyncLoading}
              className="gap-2"
            >
              {isSyncOperating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Now
            </Button>
          )}
          {isSyncEnabled && (
            <Button
              variant="outline"
              onClick={disconnectSync}
              disabled={isSyncLoading}
              className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Unlink className="w-4 h-4" />
              Disconnect Sync
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={disconnectGoogle}
            disabled={isLoading}
            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Disconnect Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
