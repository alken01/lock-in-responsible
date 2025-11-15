export const idlFactory = ({ IDL }) => {
  const GoalType = IDL.Variant({
    'Custom': IDL.Null,
    'Coding': IDL.Null,
    'Fitness': IDL.Null,
    'Study': IDL.Null,
    'Work': IDL.Null,
  });

  const GoalStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Completed': IDL.Null,
    'Failed': IDL.Null,
    'Verified': IDL.Null,
  });

  const Goal = IDL.Record({
    'id': IDL.Nat,
    'userId': IDL.Principal,
    'title': IDL.Text,
    'description': IDL.Text,
    'goalType': GoalType,
    'deadline': IDL.Int,
    'createdAt': IDL.Int,
    'status': GoalStatus,
    'proof': IDL.Opt(IDL.Text),
    'tokensReward': IDL.Nat,
  });

  const UserStats = IDL.Record({
    'totalGoals': IDL.Nat,
    'completedGoals': IDL.Nat,
    'failedGoals': IDL.Nat,
    'currentStreak': IDL.Nat,
    'longestStreak': IDL.Nat,
    'totalTokens': IDL.Nat,
  });

  return IDL.Service({
    'createGoal': IDL.Func(
      [IDL.Text, IDL.Text, GoalType, IDL.Int],
      [IDL.Nat],
      [],
    ),
    'submitProof': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'failGoal': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getMyGoals': IDL.Func([], [IDL.Vec(Goal)], ['query']),
    'getGoal': IDL.Func([IDL.Nat], [IDL.Opt(Goal)], ['query']),
    'getMyTokens': IDL.Func([], [IDL.Nat], ['query']),
    'getMyStats': IDL.Func([], [UserStats], ['query']),
    'getLeaderboard': IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))], ['query']),
    'verifyGoal': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'healthCheck': IDL.Func([], [IDL.Bool], ['query']),
    'getInfo': IDL.Func(
      [],
      [IDL.Record({
        'totalGoals': IDL.Nat,
        'totalUsers': IDL.Nat,
        'version': IDL.Text,
      })],
      ['query'],
    ),
  });
};
