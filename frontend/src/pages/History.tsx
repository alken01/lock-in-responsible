import { useQuery } from '@tanstack/react-query';
import { icpGoalAPI } from '../lib/icp-api';
import { Card, CardContent } from '../components/ui/card';
import { History as HistoryIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getStatusBadgeClass, getGoalTypeBadgeClass, getTokenBadgeClass } from '../lib/theme-config';

export default function History() {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['icp-goals', 'all'],
    queryFn: icpGoalAPI.list,
  });

  const sortedGoals = [...goals].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">
          Your goal history stored immutably on-chain
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      ) : sortedGoals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No history yet</p>
              <p className="text-sm text-muted-foreground">
                Complete some goals to see them here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedGoals.map((goal: any) => (
            <Card key={goal.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {getStatusIcon(goal.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <span className={getStatusBadgeClass(goal.status)}>
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
                          +{goal.tokensReward} TOK
                        </span>
                      )}
                    </div>
                    {goal.proof && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium mb-1">Proof Submitted</p>
                        <p className="text-xs text-muted-foreground">
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
  );
}
