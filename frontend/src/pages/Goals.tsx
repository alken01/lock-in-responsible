import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icpGoalAPI } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Target, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { ICPIntegration } from '../components/ICPIntegration';

export default function Goals() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proofText, setProofText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['icp-goals'],
    queryFn: icpGoalAPI.list,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      goalType: string;
      deadline: Date;
    }) => {
      return await icpGoalAPI.create(
        data.title,
        data.description,
        data.goalType as any,
        data.deadline
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
      setShowCreateForm(false);
    },
  });

  const submitProofMutation = useMutation({
    mutationFn: async (data: { goalId: number; proof: string }) => {
      return await icpGoalAPI.submitProof(data.goalId, data.proof);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
      setProofText('');
      setSelectedGoalId(null);
    },
  });

  const failGoalMutation = useMutation({
    mutationFn: icpGoalAPI.fail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
    },
  });

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);

    createGoalMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string || '',
      goalType: formData.get('type') as string || 'Custom',
      deadline,
    });
  };

  const handleSubmitProof = (goalId: number) => {
    if (!proofText.trim()) return;
    submitProofMutation.mutate({ goalId, proof: proofText });
  };

  const todayGoals = goals.filter((goal: any) => {
    const goalDate = new Date(goal.deadline);
    return goalDate.toDateString() === new Date().toDateString();
  });

  const completedGoals = todayGoals.filter((g: any) =>
    g.status === 'Completed' || g.status === 'Verified'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
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
              <CardDescription>
                Goals are stored on-chain and cannot be deleted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Code for 2 hours"
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

                <div className="space-y-2">
                  <Label htmlFor="type">Goal Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Coding">Coding</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createGoalMutation.isPending}>
                    {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
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
            {todayGoals.map((goal: any) => (
              <Card
                key={goal.id}
                className={
                  goal.status === 'Completed' || goal.status === 'Verified'
                    ? 'opacity-75 border-green-200'
                    : goal.status === 'Failed'
                    ? 'opacity-75 border-red-200'
                    : ''
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      {goal.status === 'Completed' || goal.status === 'Verified' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                      ) : goal.status === 'Failed' ? (
                        <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
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
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {goal.goalType}
                          </span>
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">
                            {goal.status}
                          </span>
                          {goal.tokensReward > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                              {goal.tokensReward} tokens
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {goal.status === 'Pending' && selectedGoalId !== goal.id && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setSelectedGoalId(goal.id)}
                          >
                            Submit Proof
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => failGoalMutation.mutate(goal.id)}
                          >
                            Mark Failed
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Proof Submission Form */}
                  {selectedGoalId === goal.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <Label htmlFor={`proof-${goal.id}`}>Proof of Completion</Label>
                      <textarea
                        id={`proof-${goal.id}`}
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        placeholder="Describe how you completed this goal..."
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitProof(goal.id)}
                          disabled={!proofText.trim() || submitProofMutation.isPending}
                        >
                          {submitProofMutation.isPending ? 'Submitting...' : 'Submit to Validators'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedGoalId(null);
                            setProofText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ICP Integration Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <ICPIntegration />
        </div>
      </div>
    </div>
  );
}
