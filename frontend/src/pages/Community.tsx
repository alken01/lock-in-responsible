import { useQuery } from '@tanstack/react-query';
import { icpGoalAPI } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Target, CheckCircle2, Circle, XCircle, Users } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../components/ui/input';

export default function Community() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allGoals = [], isLoading, error } = useQuery({
    queryKey: ['icp-all-goals'],
    queryFn: icpGoalAPI.listAll,
    refetchInterval: 10000, // Refresh every 10 seconds to see new goals
  });

  // Group goals by user
  const goalsByUser = allGoals.reduce((acc: any, goal: any) => {
    if (!acc[goal.userId]) {
      acc[goal.userId] = [];
    }
    acc[goal.userId].push(goal);
    return acc;
  }, {});

  // Filter goals based on search query
  const filteredGoals = allGoals.filter((goal: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      goal.title.toLowerCase().includes(query) ||
      goal.description.toLowerCase().includes(query) ||
      goal.goalType.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'Coding':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fitness':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Study':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Work':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const truncatePrincipal = (principal: string) => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
  };

  const totalUsers = Object.keys(goalsByUser).length;
  const completedGoals = allGoals.filter((g: any) =>
    g.status === 'Completed' || g.status === 'Verified'
  ).length;
  const pendingGoals = allGoals.filter((g: any) => g.status === 'Pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading community goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Goals</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load community goals'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-3xl text-green-600">{completedGoals}</CardTitle>
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
      {filteredGoals.length === 0 ? (
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
                    <Badge className={getGoalTypeColor(goal.goalType)}>
                      {goal.goalType}
                    </Badge>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                    <Badge variant="outline">
                      {goal.tokensReward} tokens
                    </Badge>
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
  );
}
