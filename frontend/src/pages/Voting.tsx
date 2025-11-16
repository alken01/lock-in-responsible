import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icpClient } from '../lib/icp-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle2, Clock } from 'lucide-react';
import { ICPIntegration } from '../components/ICPIntegration';

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
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading, error } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const requests = await icpClient.getPendingRequests();
      return requests as VerificationRequest[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

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

  const handleVote = (requestId: number, approved: boolean) => {
    setVotingOnId(requestId);
    submitVoteMutation.mutate({
      requestId,
      verified: approved,
      confidence: 100,
      reasoning: approved ? 'Proof looks valid' : 'Proof is not convincing',
    });
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

  return (
    <div className="container mx-auto p-6">
      <ICPIntegration />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Verify Proofs</h1>
        <p className="text-muted-foreground">
          Help verify goal submissions from other users. You'll earn tokens for participating.
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
  );
}
