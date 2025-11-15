import { useQuery } from '@tanstack/react-query';
import { goalAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { History as HistoryIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Goal } from '../types';

export default function History() {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', 'all'],
    queryFn: () => goalAPI.list(),
  });

  const sortedGoals = [...goals].sort((a: Goal, b: Goal) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">
          View your past goals and achievements
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
          {sortedGoals.map((goal: Goal) => (
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
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(
                          goal.status
                        )}`}
                      >
                        {goal.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Created: {format(new Date(goal.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {goal.completedAt && (
                        <span>
                          Completed: {format(new Date(goal.completedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                      <span>Progress: {goal.progress}/{goal.target}</span>
                      {goal.device && (
                        <span>📱 {goal.device.name}</span>
                      )}
                    </div>
                    {goal.verifications && goal.verifications.length > 0 && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium mb-1">Verification</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.verifications[0].feedback || 'Verified successfully'}
                        </p>
                        {goal.verifications[0].confidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {(goal.verifications[0].confidence * 100).toFixed(0)}%
                          </p>
                        )}
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
