import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiProvider, setApiProvider] = useState<'openai' | 'anthropic'>(
    user?.preferences?.llmProvider || 'openai'
  );

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => userAPI.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data);
    },
  });

  const handleSaveApiKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const apiKey = formData.get('apiKey') as string;

    updateSettingsMutation.mutate({
      preferences: {
        ...user?.preferences,
        llmApiKey: apiKey,
        llmProvider: apiProvider,
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and LLM API configuration
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <p className="text-sm text-muted-foreground">
            Profile is managed through your Google account
          </p>
        </CardContent>
      </Card>

      {/* LLM API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>LLM API Configuration</CardTitle>
              <CardDescription>
                Configure your LLM provider for goal verification
              </CardDescription>
            </div>
            <Key className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Provider Selection */}
          <div className="space-y-3">
            <Label>API Provider</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setApiProvider('openai')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  apiProvider === 'openai'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">OpenAI</div>
                <div className="text-sm text-muted-foreground">GPT-4, GPT-4o-mini</div>
              </button>
              <button
                type="button"
                onClick={() => setApiProvider('anthropic')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  apiProvider === 'anthropic'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">Anthropic</div>
                <div className="text-sm text-muted-foreground">Claude Sonnet</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">
                  {apiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input
                id="apiKey"
                name="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder={
                  apiProvider === 'openai'
                    ? 'sk-...'
                    : 'sk-ant-...'
                }
                defaultValue={user?.preferences?.llmApiKey || ''}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is encrypted and stored securely. It's only used for goal
                verification.
              </p>
            </div>

            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save API Key
            </Button>
          </form>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Want to use our API? (Coming Soon)
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Don't have an API key? Soon you'll be able to use our shared LLM service for
              just €5/month. No API key management needed!
            </p>
            <Button size="sm" variant="outline" disabled>
              Join Waitlist
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">How to get an API key:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {apiProvider === 'openai' ? (
                <>
                  <li>1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></li>
                  <li>2. Create a new API key</li>
                  <li>3. Copy and paste it above</li>
                  <li>4. Cost: ~$0.01-0.10 per verification</li>
                </>
              ) : (
                <>
                  <li>1. Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a></li>
                  <li>2. Create a new API key</li>
                  <li>3. Copy and paste it above</li>
                  <li>4. Cost: ~$0.01-0.10 per verification</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {user?.stats && (
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{user.stats.totalGoalsCompleted}</div>
                <div className="text-xs text-muted-foreground">Goals Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user.stats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{user.stats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
