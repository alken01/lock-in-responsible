import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { icpGoalAPI } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Plus, Target, CheckCircle2, Circle, XCircle, Users, ArrowDown, History as HistoryIcon, Clock } from 'lucide-react';
import { ICPIntegration } from '../components/ICPIntegration';
import { format } from 'date-fns';
import { getStatusBadgeClass, getGoalTypeBadgeClass, getTokenBadgeClass } from '../lib/theme-config';

export default function Goals() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proofText, setProofText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const communityRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to community section if navigated to /dashboard/community
  useEffect(() => {
    if (location.pathname === '/dashboard/community' && communityRef.current) {
      // Use setTimeout to ensure the component is fully rendered
      setTimeout(() => {
        communityRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.pathname]);

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['icp-goals'],
    queryFn: icpGoalAPI.list,
  });

  const { data: allGoals = [], isLoading: communityLoading } = useQuery({
    queryKey: ['icp-all-goals'],
    queryFn: icpGoalAPI.listAll,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  console.log('🎯 Goals Query State:', { goals, isLoading, error });
  console.log('🌍 Community Goals Query State:', { allGoals, communityLoading });

  const createGoalMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      goalType: string;
      deadline?: Date;
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

    const deadlineValue = formData.get('deadline') as string;
    let deadline: Date | undefined;

    if (deadlineValue) {
      deadline = new Date(deadlineValue);
      // Set to end of selected day
      deadline.setHours(23, 59, 59, 999);
    }

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

  // Community section helpers
  const scrollToCommunity = () => {
    communityRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredGoals = allGoals.filter((goal: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      goal.title.toLowerCase().includes(query) ||
      goal.description.toLowerCase().includes(query) ||
      goal.goalType.toLowerCase().includes(query)
    );
  });

  const goalsByUser = allGoals.reduce((acc: any, goal: any) => {
    if (!acc[goal.userId]) {
      acc[goal.userId] = [];
    }
    acc[goal.userId].push(goal);
    return acc;
  }, {});

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return <CheckCircle2 className="w-5 h-5 text-neon-green" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-neon-pink" />;
      default:
        return <Circle className="w-5 h-5 text-neon-cyan" />;
    }
  };

  const truncatePrincipal = (principal: string) => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
  };

  const totalUsers = Object.keys(goalsByUser).length;
  const communityCompletedGoals = allGoals.filter((g: any) =>
    g.status === 'Completed' || g.status === 'Verified'
  ).length;
  const pendingGoals = allGoals.filter((g: any) => g.status === 'Pending').length;

  // History section helpers
  const sortedHistoryGoals = [...goals].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentHistory = sortedHistoryGoals.slice(0, 5);
  const hasMoreHistory = sortedHistoryGoals.length > 5;

  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return <CheckCircle2 className="h-5 w-5 text-neon-green" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-neon-pink" />;
      default:
        return <Clock className="h-5 w-5 text-neon-cyan" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Today's Goals Section */}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={scrollToCommunity}>
                <Users className="h-4 w-4 mr-2" />
                Community
                <ArrowDown className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </div>
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

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (optional)</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Defaults to end of today if not specified
                  </p>
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
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={getGoalTypeBadgeClass(goal.goalType)}>
                            {goal.goalType}
                          </span>
                          <span className={getStatusBadgeClass(goal.status)}>
                            {goal.status}
                          </span>
                          {goal.tokensReward > 0 && (
                            <span className={getTokenBadgeClass()}>
                              {goal.tokensReward} TOK
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

      {/* History Section */}
      <div className="space-y-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <HistoryIcon className="w-6 h-6" />
              Recent History
            </h2>
            <p className="text-muted-foreground">
              Your goal history stored immutably on-chain
            </p>
          </div>
          {hasMoreHistory && (
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/history')}
            >
              View All History
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : recentHistory.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-2">
                <HistoryIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No history yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete some goals to see them here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentHistory.map((goal: any) => (
              <Card key={goal.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getHistoryStatusIcon(goal.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <span className={`whitespace-nowrap ${getStatusBadgeClass(goal.status)}`}>
                          {goal.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">
                          {format(new Date(goal.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        <span className={getGoalTypeBadgeClass(goal.goalType)}>
                          {goal.goalType}
                        </span>
                        {goal.tokensReward > 0 && (
                          <span className={getTokenBadgeClass()}>
                            {goal.tokensReward} TOK
                          </span>
                        )}
                      </div>
                      {goal.proof && (
                        <div className="mt-2 p-2 bg-muted/50 rounded-md">
                          <p className="text-xs font-medium mb-1">Proof</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {goal.proof}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Community Section */}
      <div ref={communityRef} className="space-y-6 pt-6 border-t">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Community Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            See what everyone is working on and stay motivated together
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Goals</CardDescription>
              <CardTitle className="text-3xl">{allGoals.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Users</CardDescription>
              <CardTitle className="text-3xl">{totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-green-600">{communityCompletedGoals}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{pendingGoals}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Search goals by title, description, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Goals List */}
        {communityLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading community goals...</p>
            </div>
          </div>
        ) : filteredGoals.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Goals Found</CardTitle>
              <CardDescription>
                {searchQuery
                  ? 'No goals match your search criteria. Try a different search term.'
                  : 'Be the first to create a goal and inspire the community!'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGoals.map((goal: any) => (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(goal.status)}
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-mono">
                        {truncatePrincipal(goal.userId)}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={getGoalTypeBadgeClass(goal.goalType)}>
                        {goal.goalType}
                      </span>
                      <span className={getStatusBadgeClass(goal.status)}>
                        {goal.status}
                      </span>
                      <span className={getTokenBadgeClass()}>
                        {goal.tokensReward} TOK
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deadline:</span>
                        <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Proof if available */}
                    {goal.proof && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-semibold mb-1">Proof:</p>
                        <p className="text-sm text-muted-foreground italic line-clamp-2">
                          {goal.proof}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
