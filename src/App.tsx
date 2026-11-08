import { useEffect, useState } from 'react';
import SetupScreen from '@/components/SetupScreen';
import SessionScreen from '@/components/SessionScreen';
import SettingsModal from '@/components/SettingsModal';
import { generateWorkout, getApiKey } from '@/openrouter';
import type { SessionInput, WorkoutPlan } from '@/types';
import { loadProfile, saveProfile, awardXp, type UserProfile } from '@/gamification';
import { UserProfile as UserProfileCard } from '@/components/UserProfile';
import { LevelUpModal } from '@/components/LevelUpModal';

type Screen = 'setup' | 'session';

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [levelUp, setLevelUp] = useState<{
    open: boolean;
    oldLevel: number;
    newLevel: number;
    profile: UserProfile;
    xpEarned: number;
  } | null>(null);

  const refreshKey = () => setHasApiKey(!!getApiKey());

  useEffect(() => {
    refreshKey();
  }, []);

  const handleGenerate = async (input: SessionInput) => {
    setLoading(true);
    setPlan(null);
    const result = await generateWorkout(input);
    setPlan(result.plan);
    setSource(result.source);
    setLoading(false);
    setScreen('session');
  };

  const handleRestart = () => {
    setScreen('setup');
    setPlan(null);
    refreshKey();
  };

  const handleFinish = (xpEarned: number) => {
    const { profile: newProfile, leveledUp } = awardXp(profile, xpEarned);
    setProfile(newProfile);
    saveProfile(newProfile);
    if (leveledUp) {
      setLevelUp({
        open: true,
        oldLevel: profile.level,
        newLevel: newProfile.level,
        profile: newProfile,
        xpEarned,
      });
    }
  };

  const handleCloseLevelUp = () => {
    setLevelUp(null);
  };

  return (
    <>
      {screen === 'setup' && (
        <>
          <div className="relative z-10 mb-4">
            <UserProfileCard profile={profile} compact />
          </div>
          <SetupScreen
            onGenerate={handleGenerate}
            onOpenSettings={() => setSettingsOpen(true)}
            hasApiKey={hasApiKey}
            loading={loading}
          />
        </>
      )}
      {screen === 'session' && plan && (
        <SessionScreen
          plan={plan}
          source={source}
          profile={profile}
          onComplete={(xpEarned: number) => {
            handleFinish(xpEarned);
            setScreen('setup');
          }}
          onRestart={handleRestart}
        />
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          refreshKey();
        }}
      />
      {levelUp && (
        <LevelUpModal
          open={levelUp.open}
          onClose={handleCloseLevelUp}
          oldLevel={levelUp.oldLevel}
          newLevel={levelUp.newLevel}
          profile={levelUp.profile}
          xpEarned={levelUp.xpEarned}
        />
      )}
    </>
  );
}

export default App;
