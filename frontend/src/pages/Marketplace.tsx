import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, Target, Sparkles, TrendingUp, Code, Dumbbell, BookOpen, Briefcase } from 'lucide-react';
import { icpGoalAPI } from '../lib/icp-api';

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goalType: string;
  price: number;
  icon: any;
  popular?: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: '1',
    title: '30-Day Coding Challenge',
    description: 'Code for at least 1 hour every day for 30 days. Build the habit of consistent programming practice.',
    goalType: 'Coding',
    price: 5,
    icon: Code,
    popular: true,
    difficulty: 'Medium',
  },
  {
    id: '2',
    title: 'Morning Workout Routine',
    description: 'Complete a 30-minute workout every morning for 21 days to build a lasting fitness habit.',
    goalType: 'Fitness',
    price: 3,
    icon: Dumbbell,
    popular: true,
    difficulty: 'Easy',
  },
  {
    id: '3',
    title: 'Learn Spanish - 100 Days',
    description: 'Study Spanish for 30 minutes daily. Includes vocabulary, grammar, and conversation practice.',
    goalType: 'Study',
    price: 8,
    icon: BookOpen,
    difficulty: 'Hard',
  },
  {
    id: '4',
    title: 'Side Project Launch',
    description: 'Ship your side project in 14 days. Daily milestones from idea to deployment.',
    goalType: 'Work',
    price: 10,
    icon: Briefcase,
    popular: true,
    difficulty: 'Hard',
  },
  {
    id: '5',
    title: 'Deep Work Sessions',
    description: '2 hours of focused, distraction-free work every day for 30 days.',
    goalType: 'Work',
    price: 5,
    icon: Target,
    difficulty: 'Medium',
  },
  {
    id: '6',
    title: 'AI/ML Learning Path',
    description: '60-day structured program to learn AI fundamentals, build 3 projects, and deploy them.',
    goalType: 'Study',
    price: 12,
    icon: Sparkles,
    difficulty: 'Hard',
  },
  {
    id: '7',
    title: '10K Steps Daily',
    description: 'Walk 10,000 steps every day for 30 days. Track with your phone or smartwatch.',
    goalType: 'Fitness',
    price: 3,
    icon: TrendingUp,
    difficulty: 'Easy',
  },
  {
    id: '8',
    title: 'Algorithm Practice Streak',
    description: 'Solve 2 LeetCode/HackerRank problems daily for 45 days to ace technical interviews.',
    goalType: 'Coding',
    price: 7,
    icon: Code,
    difficulty: 'Medium',
  },
];

export default function Marketplace() {
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const queryClient = useQueryClient();

  const purchaseMutation = useMutation({
    mutationFn: async (template: GoalTemplate) => {
      // Create goal from template
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30); // Default 30 days from now

      return await icpGoalAPI.create(
        template.title,
        template.description,
        template.goalType as any,
        deadline
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
      setSelectedTemplate(null);
    },
  });

  const handlePurchase = (template: GoalTemplate) => {
    setSelectedTemplate(template);
  };

  const confirmPurchase = () => {
    if (selectedTemplate) {
      purchaseMutation.mutate(selectedTemplate);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Goal Template Marketplace
        </h1>
        <p className="text-muted-foreground mt-2">
          Browse proven goal templates created by successful users. Buy with tokens and start your journey.
        </p>
      </div>

      {/* AI-Powered Badge */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                AI-Powered Recommendations
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Our AI analyzes your purchase history and success patterns to recommend templates that match your goals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOAL_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow relative">
              {template.popular && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    🔥 Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{template.goalType}</Badge>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 line-clamp-3">
                  {template.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{template.price}</span>
                    <span className="text-sm text-muted-foreground">TOK</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(template)}
                    disabled={purchaseMutation.isPending}
                  >
                    Purchase
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirm Purchase</CardTitle>
              <CardDescription>
                You're about to purchase this goal template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedTemplate.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTemplate.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Price:</span>
                  <span className="font-bold text-lg">{selectedTemplate.price} TOK</span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 This template will be added to your goals. You'll still need to complete it and submit proof to earn the 10 TOK reward!
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={confirmPurchase}
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? 'Purchasing...' : 'Confirm Purchase'}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  disabled={purchaseMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
