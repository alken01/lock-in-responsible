import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Target, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Goal } from '../types';

export default function Goals() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalAPI.list(),
  });

  const createGoalMutation = useMutation({
    mutationFn: goalAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowCreateForm(false);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createGoalMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type') || 'custom',
      target: parseInt(formData.get('target') as string) || 1,
      verificationType: 'llm',
    });
  };

  const todayGoals = goals.filter((goal: Goal) => {
    if (!goal.dueDate) return goal.status === 'pending';
    return new Date(goal.dueDate).toDateString() === new Date().toDateString();
  });

  const pendingGoals = todayGoals.filter((g: Goal) => g.status === 'pending');
  const completedGoals = todayGoals.filter((g: Goal) => g.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Today's Goals</h1>
          <p className="text-muted-foreground">
            {completedGoals.length} of {todayGoals.length} goals completed
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
            <CardDescription>Set a goal to work towards today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Make 3 GitHub commits"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Additional details about this goal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Goal Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="custom">Custom</option>
                    <option value="github_commits">GitHub Commits</option>
                    <option value="time_based">Time Based</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    name="target"
                    type="number"
                    defaultValue={1}
                    min={1}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createGoalMutation.isPending}>
                  Create Goal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      ) : todayGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No goals for today</p>
              <p className="text-sm text-muted-foreground">
                Create your first goal to get started
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {todayGoals.map((goal: Goal) => (
            <Card key={goal.id} className={goal.status === 'completed' ? 'opacity-75' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    {goal.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Progress: {goal.progress}/{goal.target}
                        </span>
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {goal.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {goal.status === 'pending' && (
                      <Button size="sm" variant="outline">
                        Submit Proof
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
