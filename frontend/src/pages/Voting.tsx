import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { icpClient, icpGoalAPI } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle2, Clock, Eye, Target } from 'lucide-react';
import { ICPIntegration } from '../components/ICPIntegration';
import { getGoalTypeBadgeClass, getStatusBadgeClass, getTokenBadgeClass } from '../lib/theme-config';

interface VerificationRequest {
  id: bigint;
  goalId: bigint;
  userId: any;
  proofText: string;
  proofUrl: string[] | null;
  fee: bigint;
  validators: any[];
  verdicts: any[];
  status: { Pending?: null; Complete?: null; Failed?: null };
  createdAt: bigint;
  deadline: bigint;
}

export default function Voting() {
  const [votingOnId, setVotingOnId] = useState<number | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading, error } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const requests = await icpClient.getPendingRequests();
      return requests as VerificationRequest[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const { data: goalsInReview = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['icp-goals-in-review'],
    queryFn: icpGoalAPI.listInReview,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const { data: userPrincipal } = useQuery({
    queryKey: ['user-principal'],
    queryFn: async () => {
      const principal = await icpClient.getPrincipal();
      return principal?.toString() || null;
    },
  });

  // Filter out user's own goals - only show other users' goals to review
  const othersGoalsInReview = goalsInReview.filter((goal: any) => goal.userId !== userPrincipal);

  // Set selected goal from URL parameter
  useEffect(() => {
    const goalId = searchParams.get('goalId');
    if (goalId && othersGoalsInReview.length > 0) {
      setSelectedGoalId(Number(goalId));
    }
  }, [searchParams, othersGoalsInReview]);

  const submitVoteMutation = useMutation({
    mutationFn: async (data: {
      requestId: number;
      verified: boolean;
      confidence: number;
      reasoning: string;
    }) => {
      return await icpClient.submitVerdict(
        data.requestId,
        data.verified,
        data.confidence,
        data.reasoning
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      setVotingOnId(null);
    },
  });

  const verifyGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      // Call the verifyGoal method from the backend
      const actor = (icpClient as any).actor;
      if (!actor) throw new Error('Not connected to ICP');
      return await actor.verifyGoal(BigInt(goalId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-goals-in-review'] });
      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
      queryClient.invalidateQueries({ queryKey: ['icp-all-goals'] });
      setSelectedGoalId(null);
    },
  });

  const handleVote = (requestId: number, approved: boolean) => {
    setVotingOnId(requestId);
    submitVoteMutation.mutate({
      requestId,
      verified: approved,
      confidence: 100,
      reasoning: approved ? 'Proof looks valid' : 'Proof is not convincing',
    });
  };

  const handleVerifyGoal = (goalId: number) => {
    verifyGoalMutation.mutate(goalId);
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const formatDeadline = (deadline: bigint) => {
    const deadlineDate = new Date(Number(deadline) / 1000000);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes < 0) return 'Expired';
    return `${minutes}m remaining`;
  };

  const truncatePrincipal = (principal: string) => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <ICPIntegration />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Review & Verify Proofs</h1>
        <p className="text-muted-foreground">
          Help verify goal submissions from other users. You'll earn tokens for participating.
        </p>
      </div>

      {/* Goals In Review Section */}
      {othersGoalsInReview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Review Community Goals
              </h2>
              <p className="text-muted-foreground">
                {othersGoalsInReview.length} goal{othersGoalsInReview.length !== 1 ? 's' : ''} waiting for review
              </p>
            </div>
            {othersGoalsInReview.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="goal-select" className="text-sm font-medium">
                  Select Goal:
                </label>
                <select
                  id="goal-select"
                  value={selectedGoalId || ''}
                  onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Choose a goal to review...</option>
                  {othersGoalsInReview.map((goal: any) => (
                    <option key={goal.id} value={goal.id}>
                      Goal #{goal.id} - {goal.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {goalsLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading goals to review...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {othersGoalsInReview
                .filter((goal: any) => !selectedGoalId || goal.id === selectedGoalId)
                .map((goal: any) => (
                  <Card key={goal.id} className="border-yellow-500/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-5 h-5 text-yellow-500" />
                            <CardTitle className="text-lg">Goal #{goal.id}: {goal.title}</CardTitle>
                          </div>
                          <CardDescription>{goal.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Submitted by: <span className="font-mono">{truncatePrincipal(goal.userId)}</span>
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

                      {/* Proof */}
                      {goal.proof && (
                        <div>
                          <h3 className="font-semibold mb-2">Proof Submitted:</h3>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="whitespace-pre-wrap">{goal.proof}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Review and approve or reject this goal
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerifyGoal(goal.id)}
                            disabled={verifyGoalMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Approve
                          </Button>
                        </div>
                      </div>

                      {verifyGoalMutation.isPending && (
                        <div className="text-sm text-muted-foreground text-center">
                          Submitting your review...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Divider if both sections exist */}
      {othersGoalsInReview.length > 0 && pendingRequests.length > 0 && (
        <div className="border-t pt-8" />
      )}

      {/* Pending Verification Requests Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Verification Requests</h2>
          <p className="text-muted-foreground">
            Vote on verification requests from the community
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Clock className="w-6 h-6 animate-spin mr-2" />
                <span>Loading verification requests...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-red-500">Error loading verification requests</div>
            </CardContent>
          </Card>
        ) : pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending verification requests</p>
                <p className="text-sm mt-2">
                  You'll be randomly selected to verify proofs submitted by other users.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={Number(request.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Verification Request #{Number(request.id)}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDeadline(request.deadline)}
                    </div>
                  </div>
                  <CardDescription>
                    Submitted {formatTimestamp(request.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Proof Submitted:</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{request.proofText}</p>
                    </div>
                  </div>

                  {request.proofUrl && request.proofUrl.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Proof URL:</h3>
                      <a
                        href={request.proofUrl[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {request.proofUrl[0]}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {request.verdicts.length} / {request.validators.length} votes submitted
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVote(Number(request.id), false)}
                        disabled={votingOnId === Number(request.id)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleVote(Number(request.id), true)}
                        disabled={votingOnId === Number(request.id)}
                        className="flex items-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  {votingOnId === Number(request.id) && submitVoteMutation.isPending && (
                    <div className="text-sm text-muted-foreground text-center">
                      Submitting your vote...
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
