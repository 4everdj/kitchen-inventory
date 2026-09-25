
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export function AuthSync() {
  const loadHouseholdData = useStore(
    (state) => state.loadHouseholdData
  );

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted || !session?.user) {
        return;
      }

      const user = session.user;

      const { data: membership, error: membershipError } =
        await supabase
          .from('household_members')
          .select('household_id, role')
          .eq('user_id', user.id)
          .maybeSingle();

      if (membershipError) {
        console.error(
          'Unable to load household membership:',
          membershipError.message
        );
        return;
      }

      if (!membership) {
        useStore.setState({
          userId: user.id,
          userName:
            user.user_metadata?.display_name ??
            user.email ??
            'User',
          households: [],
          activeHouseholdId: null,
        });

        return;
      }

      const { data: household, error: householdError } =
        await supabase
          .from('households')
          .select('*')
          .eq('id', membership.household_id)
          .single();

      if (householdError) {
        console.error(
          'Unable to load household:',
          householdError.message
        );
        return;
      }

      if (!mounted) return;

      useStore.setState({
        userId: user.id,
        userName:
          user.user_metadata?.display_name ??
          user.email ??
          'User',
        households: [household],
        activeHouseholdId: household.id,
      });

      await loadHouseholdData();
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          useStore.setState({
            userId: null,
            userName: null,
            households: [],
            activeHouseholdId: null,
            items: [],
            shoppingList: [],
            history: [],
          });

          return;
        }

        if (
          (event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED') &&
          session?.user
        ) {
          await restoreSession();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadHouseholdData]);

  return null;
}

