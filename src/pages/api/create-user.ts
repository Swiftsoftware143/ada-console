// ADASwift API: Create User
import { NextApiRequest, NextApiResponse } from 'next';
import { createUserProfile } from '../../lib/supabase';
import { CreateUserInput, VALID_PLANS, PlanId } from '../../types';

interface CreateUserRequest {
  email: string;
  planId: PlanId;
  mintbirdCustomerId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, planId, mintbirdCustomerId }: CreateUserRequest = req.body;

    if (!email || !planId || !mintbirdCustomerId) {
      return res.status(400).json({ message: 'Missing required fields: email, planId, mintbirdCustomerId' });
    }

    if (!VALID_PLANS.includes(planId)) {
      return res.status(400).json({ message: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const userInput: CreateUserInput = {
      email: email.toLowerCase().trim(),
      planId,
      mintbirdCustomerId,
    };

    const user = await createUserProfile(userInput);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.user_id,
        email: user.email,
        plan: user.plan_id,
        systemTag: user.system_tag,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    
    if (message.includes('duplicate') || message.includes('already exists')) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    return res.status(500).json({ message });
  }
}
