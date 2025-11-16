import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ShoppingCart, Target, Sparkles, TrendingUp, Code, Dumbbell, BookOpen, Briefcase, Shield, Award, Twitter, ExternalLink, Flame } from 'lucide-react';
import { icpGoalAPI } from '../lib/icp-api';
import { fetchProductivityChallenges, parseTwitterToGoal, type DerivedGoal } from '../lib/origin-twitter';

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goalType: string;
  price: number;
  icon: any;
  popular?: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ipRegistered?: boolean;
  creator?: string;
  royalties?: number;
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
    ipRegistered: true,
    creator: 'creator.near',
    royalties: 0.5,
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
    ipRegistered: true,
    creator: 'fitguru.near',
    royalties: 0.3,
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
    ipRegistered: true,
    creator: 'builder.near',
    royalties: 1.0,
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
  const [selectedTwitterGoal, setSelectedTwitterGoal] = useState<DerivedGoal | null>(null);
  const [twitterGoals, setTwitterGoals] = useState<DerivedGoal[]>([]);
  const [loadingTwitter, setLoadingTwitter] = useState(false);
  const [activeTab, setActiveTab] = useState<'curated' | 'social'>('curated');
  const queryClient = useQueryClient();

  // Fetch Twitter goals on mount
  useEffect(() => {
    loadTwitterGoals();
  }, []);

  const loadTwitterGoals = async () => {
    setLoadingTwitter(true);
    try {
      const tweets = await fetchProductivityChallenges();
      const parsed = await Promise.all(tweets.map(parseTwitterToGoal));
      setTwitterGoals(parsed);
    } catch (error) {
      console.error('Failed to load Twitter goals:', error);
    } finally {
      setLoadingTwitter(false);
    }
  };

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

      {/* Origin SDK IP Registration Badge */}
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 border-2 border-blue-300">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                Powered by Camp Network Origin SDK
                <Badge className="bg-blue-600 text-white">IP-Registered</Badge>
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Access content from Twitter, Spotify, TikTok via Origin API. AI parses challenges into IP-registered templates. Original creators earn royalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'curated' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('curated')}
          className="rounded-b-none"
        >
          <Target className="w-4 h-4 mr-2" />
          Curated Templates
        </Button>
        <Button
          variant={activeTab === 'social' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('social')}
          className="rounded-b-none"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Discover from Social
          <Badge className="ml-2 bg-orange-500 text-white">Live via Origin SDK</Badge>
        </Button>
      </div>

      {/* Curated Templates Grid */}
      {activeTab === 'curated' && (
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">{template.goalType}</Badge>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                      {template.ipRegistered && (
                        <Badge className="bg-blue-600 text-white flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          IP Registered
                        </Badge>
                      )}
                    </div>
                    {template.creator && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        by {template.creator} • {template.royalties} TOK royalties
                      </p>
                    )}
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
      )}

      {/* Twitter/Social Goals Grid */}
      {activeTab === 'social' && (
        <>
          <div className="bg-cyan-50 dark:bg-cyan-950 border-2 border-cyan-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Twitter className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-cyan-900 dark:text-cyan-100">
                  Live Social Challenge Discovery
                </p>
                <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
                  These challenges were discovered via Origin SDK's social API, parsed by AI, and registered as derivative IP.
                  Original creators earn 30% royalties on purchases.
                </p>
              </div>
            </div>
          </div>

          {loadingTwitter ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading challenges from Twitter via Origin SDK...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {twitterGoals.map((goal) => (
                <Card key={goal.source.tweetId} className="hover:shadow-lg transition-shadow border-cyan-200">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                        <Twitter className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{goal.goalType}</Badge>
                          <Badge className={getDifficultyColor(goal.difficulty)}>
                            {goal.difficulty}
                          </Badge>
                          <Badge className="bg-cyan-600 text-white flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Derived IP
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            by {goal.source.author}
                          </p>
                          <a
                            href={goal.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View source
                          </a>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {goal.source.likes.toLocaleString()} likes • {goal.source.retweets.toLocaleString()} retweets
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-3">
                      {goal.description}
                    </CardDescription>
                    <div className="mb-3 text-xs text-muted-foreground">
                      Duration: {goal.estimatedDuration}
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTwitterGoal(goal)}
                    >
                      License Challenge
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

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
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border-2 border-blue-200">
                <div className="flex items-start gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      IP License Purchase via Origin SDK
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      You're licensing this productivity methodology as on-chain IP. {selectedTemplate.royalties} TOK goes to creator {selectedTemplate.creator}.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-100 border-t border-blue-200 pt-2 mt-2">
                  💡 Complete this goal and earn 10 TOK reward - that's {Math.round((10 / selectedTemplate.price) * 100)}% ROI!
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

      {/* Twitter Goal License Modal */}
      {selectedTwitterGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="w-5 h-5 text-cyan-600" />
                License Derived IP
              </CardTitle>
              <CardDescription>
                IP derived from social content via Origin SDK
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedTwitterGoal.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTwitterGoal.description}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{selectedTwitterGoal.estimatedDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="font-medium">{selectedTwitterGoal.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original creator:</span>
                    <span className="font-medium">{selectedTwitterGoal.source.author}</span>
                  </div>
                </div>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-950 p-3 rounded-lg border-2 border-cyan-200">
                <div className="flex items-start gap-2 mb-2">
                  <Shield className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                      Derivative IP License via Origin SDK
                    </p>
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">
                      Origin API accessed Twitter → AI parsed content → Registered as derivative IP.
                      Royalty split: 30% to {selectedTwitterGoal.source.author}, 20% to platform, 50% to you when relicensed.
                    </p>
                  </div>
                </div>
                <div className="border-t border-cyan-200 pt-2 mt-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-cyan-700">Source tweet:</span>
                    <a
                      href={selectedTwitterGoal.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-700">Social proof:</span>
                    <span className="text-cyan-900 dark:text-cyan-100 font-medium">
                      {selectedTwitterGoal.source.likes.toLocaleString()} likes
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  💡 This is FREE to license! Complete it and earn 10 TOK reward + ability to relicense for profit.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    // Create goal from Twitter template
                    const deadline = new Date();
                    deadline.setDate(deadline.getDate() + 30);

                    icpGoalAPI.create(
                      selectedTwitterGoal.title,
                      selectedTwitterGoal.description,
                      selectedTwitterGoal.goalType as any,
                      deadline
                    ).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['icp-goals'] });
                      setSelectedTwitterGoal(null);
                    });
                  }}
                >
                  License & Add to Goals
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setSelectedTwitterGoal(null)}
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
